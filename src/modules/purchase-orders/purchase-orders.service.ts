import { Prisma, PurchaseOrderStatus, StockMovementType } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import prisma from "../../config/prisma.js";
import ApiError from "../../utils/ApiError.js";
import {
  AuthenticatedUser,
  CreatePurchaseOrderPayload,
  PurchaseOrderQueryOptions,
  UpdatePurchaseOrderPayload,
  UpdatePurchaseOrderStatusPayload,
} from "./purchase-orders.interface.js";

const purchaseOrderDetailsSelect = {
  id: true,
  poNumber: true,
  supplierId: true,
  supplier: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      isActive: true,
    },
  },
  createdById: true,
  createdBy: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
  status: true,
  note: true,
  totalCost: true,
  orderedAt: true,
  receivedAt: true,
  createdAt: true,
  updatedAt: true,
  items: {
    select: {
      id: true,
      purchaseOrderId: true,
      productId: true,
      product: {
        select: {
          id: true,
          name: true,
          sku: true,
          barcode: true,
          avatar: true,
          stockQty: true,
          unitPrice: true,
          costPrice: true,
        },
      },
      quantity: true,
      unitCost: true,
      createdAt: true,
      updatedAt: true,
    },
  },
} as const;

const purchaseOrderSummarySelect = {
  id: true,
  poNumber: true,
  supplierId: true,
  supplier: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
    },
  },
  createdById: true,
  createdBy: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
  status: true,
  note: true,
  totalCost: true,
  orderedAt: true,
  receivedAt: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      items: true,
    },
  },
} as const;

const generateUniquePoNumber = async (tx: Prisma.TransactionClient): Promise<string> => {
  const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  let attempts = 0;

  while (attempts < 10) {
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const candidate = `PO-${datePrefix}-${randomSuffix}`;
    const exists = await tx.purchaseOrder.findUnique({
      where: { poNumber: candidate },
      select: { id: true },
    });

    if (!exists) {
      return candidate;
    }
    attempts++;
  }

  const timestampSuffix = Date.now().toString(36).toUpperCase();
  return `PO-${datePrefix}-${timestampSuffix}`;
};

const createPurchaseOrder = async (
  payload: CreatePurchaseOrderPayload,
  user: AuthenticatedUser,
) => {
  const supplier = await prisma.supplier.findUnique({
    where: { id: payload.supplierId.trim() },
  });

  if (!supplier) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Supplier not found");
  }

  if (!supplier.isActive) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Cannot create purchase order for an inactive supplier",
    );
  }

  if (!payload.items || payload.items.length === 0) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Items array cannot be empty",
    );
  }

  const productIds = payload.items.map((i) => i.productId.trim());
  const uniqueProductIds = new Set(productIds);

  if (uniqueProductIds.size !== productIds.length) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Duplicate product IDs in a single purchase order are not allowed",
    );
  }

  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });

  if (products.length !== productIds.length) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      "One or more products not found",
    );
  }

  const productMap = new Map(products.map((p) => [p.id, p]));

  for (const item of payload.items) {
    const product = productMap.get(item.productId.trim())!;
    if (!product.isActive) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `Product "${product.name}" is inactive`,
      );
    }
    if (product.supplierId !== supplier.id) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `Product "${product.name}" does not belong to supplier "${supplier.name}"`,
      );
    }
  }

  let totalCost = new Prisma.Decimal(0);
  const itemsData = payload.items.map((item) => {
    const qty = item.quantity;
    if (!qty || !Number.isInteger(qty) || qty <= 0) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Quantity must be a positive integer",
      );
    }

    const costNum = Number(item.unitCost);
    if (isNaN(costNum) || costNum < 0) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Unit cost must be a non-negative number",
      );
    }

    const unitCost = new Prisma.Decimal(String(item.unitCost));
    const lineCost = unitCost.mul(qty);
    totalCost = totalCost.add(lineCost);

    return {
      productId: item.productId.trim(),
      quantity: qty,
      unitCost,
    };
  });

  const result = await prisma.$transaction(async (tx) => {
    const poNumber = await generateUniquePoNumber(tx);

    const po = await tx.purchaseOrder.create({
      data: {
        poNumber,
        supplierId: supplier.id,
        createdById: user.id,
        status: PurchaseOrderStatus.DRAFT,
        note: payload.note?.trim() ? payload.note.trim() : "",
        totalCost,
        orderedAt: null,
      },
    });

    for (const item of itemsData) {
      await tx.purchaseOrderItem.create({
        data: {
          purchaseOrderId: po.id,
          productId: item.productId,
          quantity: item.quantity,
          unitCost: item.unitCost,
        },
      });
    }

    return tx.purchaseOrder.findUnique({
      where: { id: po.id },
      select: purchaseOrderDetailsSelect,
    });
  });

  return result;
};

const getAllPurchaseOrders = async (options: PurchaseOrderQueryOptions) => {
  const MAX_LIMIT = 100;
  const page = Math.max(1, Number(options.page) || 1);
  const limit = Math.min(Math.max(1, Number(options.limit) || 10), MAX_LIMIT);
  const skip = (page - 1) * limit;

  const allowedSortFields = [
    "createdAt",
    "orderedAt",
    "receivedAt",
    "totalCost",
    "poNumber",
  ];

  if (options.sortBy && !allowedSortFields.includes(options.sortBy)) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `Invalid sort field: ${options.sortBy}`,
    );
  }

  if (
    options.sortOrder &&
    !["asc", "desc"].includes(options.sortOrder.toLowerCase())
  ) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `Invalid sort order: ${options.sortOrder}`,
    );
  }

  let orderBy: Record<string, "asc" | "desc"> = { createdAt: "desc" };
  if (options.sortBy) {
    const direction = (
      options.sortOrder?.toLowerCase() === "asc" ? "asc" : "desc"
    ) as "asc" | "desc";
    orderBy = { [options.sortBy]: direction };
  }

  const whereClause: any = {};

  if (
    options.search &&
    typeof options.search === "string" &&
    options.search.trim().length > 0
  ) {
    whereClause.poNumber = {
      contains: options.search.trim(),
      mode: "insensitive",
    };
  }

  if (options.status) {
    if (
      !Object.values(PurchaseOrderStatus).includes(
        options.status as PurchaseOrderStatus,
      )
    ) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `Invalid purchase order status: ${options.status}`,
      );
    }
    whereClause.status = options.status as PurchaseOrderStatus;
  }

  if (options.supplierId) {
    whereClause.supplierId = options.supplierId.trim();
  }

  const startParam = options.startDate || options.fromDate;
  const endParam = options.endDate || options.toDate;

  if (startParam) {
    const start = new Date(startParam);
    if (isNaN(start.getTime())) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid start date format");
    }
    whereClause.createdAt = {
      ...whereClause.createdAt,
      gte: start,
    };
  }

  if (endParam) {
    const end = new Date(endParam);
    if (isNaN(end.getTime())) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid end date format");
    }
    whereClause.createdAt = {
      ...whereClause.createdAt,
      lte: end,
    };
  }

  const [total, data] = await Promise.all([
    prisma.purchaseOrder.count({ where: whereClause }),
    prisma.purchaseOrder.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy,
      select: purchaseOrderSummarySelect,
    }),
  ]);

  const formattedData = data.map((po) => ({
    id: po.id,
    poNumber: po.poNumber,
    supplierId: po.supplierId,
    supplier: po.supplier,
    createdById: po.createdById,
    createdBy: po.createdBy,
    status: po.status,
    note: po.note,
    totalCost: po.totalCost,
    itemCount: po._count.items,
    orderedAt: po.orderedAt,
    receivedAt: po.receivedAt,
    createdAt: po.createdAt,
    updatedAt: po.updatedAt,
  }));

  return {
    pagination: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data: formattedData,
  };
};

const getPurchaseOrderById = async (id: string) => {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id },
    select: purchaseOrderDetailsSelect,
  });

  if (!po) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Purchase order not found");
  }

  const itemsWithLineTotal = po.items.map((item) => ({
    ...item,
    lineTotal: item.unitCost.mul(item.quantity),
  }));

  return {
    ...po,
    items: itemsWithLineTotal,
  };
};

const updatePurchaseOrder = async (
  id: string,
  payload: UpdatePurchaseOrderPayload,
) => {
  if (!payload || Object.keys(payload).length === 0) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "At least one field must be provided for update",
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const existingPo = await tx.purchaseOrder.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existingPo) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Purchase order not found");
    }

    if (existingPo.status !== PurchaseOrderStatus.DRAFT) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Only purchase orders in DRAFT status can be updated",
      );
    }

    let targetSupplierId = existingPo.supplierId;
    if (payload.supplierId !== undefined) {
      const supplier = await tx.supplier.findUnique({
        where: { id: payload.supplierId.trim() },
      });

      if (!supplier) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Supplier not found");
      }

      if (!supplier.isActive) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          "Cannot assign an inactive supplier to purchase order",
        );
      }

      targetSupplierId = supplier.id;
    }

    const updateData: Prisma.PurchaseOrderUpdateInput = {};

    if (payload.supplierId !== undefined) {
      updateData.supplier = { connect: { id: targetSupplierId } };
    }

    if (payload.note !== undefined) {
      updateData.note = payload.note?.trim() ? payload.note.trim() : "";
    }

    if (payload.items !== undefined) {
      if (payload.items.length === 0) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          "Items array cannot be empty",
        );
      }

      const productIds = payload.items.map((i) => i.productId.trim());
      const uniqueProductIds = new Set(productIds);

      if (uniqueProductIds.size !== productIds.length) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          "Duplicate product IDs in a single purchase order are not allowed",
        );
      }

      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
      });

      if (products.length !== productIds.length) {
        throw new ApiError(
          StatusCodes.NOT_FOUND,
          "One or more products not found",
        );
      }

      const productMap = new Map(products.map((p) => [p.id, p]));

      for (const item of payload.items) {
        const product = productMap.get(item.productId.trim())!;
        if (!product.isActive) {
          throw new ApiError(
            StatusCodes.BAD_REQUEST,
            `Product "${product.name}" is inactive`,
          );
        }
        if (product.supplierId !== targetSupplierId) {
          throw new ApiError(
            StatusCodes.BAD_REQUEST,
            `Product "${product.name}" does not belong to the selected supplier`,
          );
        }
      }

      let totalCost = new Prisma.Decimal(0);
      const itemsData = payload.items.map((item) => {
        const qty = item.quantity;
        if (!qty || !Number.isInteger(qty) || qty <= 0) {
          throw new ApiError(
            StatusCodes.BAD_REQUEST,
            "Quantity must be a positive integer",
          );
        }

        const costNum = Number(item.unitCost);
        if (isNaN(costNum) || costNum < 0) {
          throw new ApiError(
            StatusCodes.BAD_REQUEST,
            "Unit cost must be a non-negative number",
          );
        }

        const unitCost = new Prisma.Decimal(String(item.unitCost));
        const lineCost = unitCost.mul(qty);
        totalCost = totalCost.add(lineCost);

        return {
          productId: item.productId.trim(),
          quantity: qty,
          unitCost,
        };
      });

      await tx.purchaseOrderItem.deleteMany({
        where: { purchaseOrderId: id },
      });

      for (const item of itemsData) {
        await tx.purchaseOrderItem.create({
          data: {
            purchaseOrderId: id,
            productId: item.productId,
            quantity: item.quantity,
            unitCost: item.unitCost,
          },
        });
      }

      updateData.totalCost = totalCost;
    }

    await tx.purchaseOrder.update({
      where: { id },
      data: updateData,
    });

    return tx.purchaseOrder.findUnique({
      where: { id },
      select: purchaseOrderDetailsSelect,
    });
  });

  return result;
};

const updatePurchaseOrderStatus = async (
  id: string,
  payload: UpdatePurchaseOrderStatusPayload,
) => {
  const targetStatus = payload.status;

  if (targetStatus === PurchaseOrderStatus.RECEIVED) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Cannot manually transition status to RECEIVED. Use the dedicated /receive endpoint instead",
    );
  }

  const existingPo = await prisma.purchaseOrder.findUnique({
    where: { id },
  });

  if (!existingPo) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Purchase order not found");
  }

  if (existingPo.status === targetStatus) {
    return prisma.purchaseOrder.findUnique({
      where: { id },
      select: purchaseOrderDetailsSelect,
    });
  }

  if (existingPo.status === PurchaseOrderStatus.RECEIVED) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "A received purchase order cannot be modified or cancelled",
    );
  }

  if (existingPo.status === PurchaseOrderStatus.CANCELLED) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "A cancelled purchase order cannot be transitioned",
    );
  }

  const isDraftToOrdered =
    existingPo.status === PurchaseOrderStatus.DRAFT &&
    targetStatus === PurchaseOrderStatus.ORDERED;
  const isDraftToCancelled =
    existingPo.status === PurchaseOrderStatus.DRAFT &&
    targetStatus === PurchaseOrderStatus.CANCELLED;
  const isOrderedToCancelled =
    existingPo.status === PurchaseOrderStatus.ORDERED &&
    targetStatus === PurchaseOrderStatus.CANCELLED;

  if (!isDraftToOrdered && !isDraftToCancelled && !isOrderedToCancelled) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `Invalid status transition from ${existingPo.status} to ${targetStatus}`,
    );
  }

  const updatedPo = await prisma.purchaseOrder.update({
    where: { id },
    data: {
      status: targetStatus,
      ...(isDraftToOrdered && { orderedAt: new Date() }),
    },
    select: purchaseOrderDetailsSelect,
  });

  return updatedPo;
};

const receivePurchaseOrder = async (id: string, user: AuthenticatedUser) => {
  const existingPo = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!existingPo) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Purchase order not found");
  }

  if (existingPo.status === PurchaseOrderStatus.RECEIVED) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Purchase order has already been received",
    );
  }

  if (existingPo.status === PurchaseOrderStatus.CANCELLED) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Cannot receive a cancelled purchase order",
    );
  }

  if (existingPo.status !== PurchaseOrderStatus.ORDERED) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Purchase order must be in ORDERED status before receiving",
    );
  }

  if (existingPo.items.length === 0) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Cannot receive an empty purchase order",
    );
  }

  for (const item of existingPo.items) {
    if (!item.product.isActive) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `Cannot receive order because product "${item.product.name}" is inactive`,
      );
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatePo = await tx.purchaseOrder.updateMany({
      where: {
        id,
        status: PurchaseOrderStatus.ORDERED,
      },
      data: {
        status: PurchaseOrderStatus.RECEIVED,
        receivedAt: new Date(),
      },
    });

    if (updatePo.count === 0) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Purchase order has already been received or is concurrently modified",
      );
    }

    for (const item of existingPo.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stockQty: { increment: item.quantity },
        },
      });

      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          type: StockMovementType.PURCHASE,
          quantityChange: item.quantity,
          purchaseOrderItemId: item.id,
          createdById: user.id,
          note: `Received PO ${existingPo.poNumber}`,
        },
      });
    }

    return tx.purchaseOrder.findUnique({
      where: { id },
      select: purchaseOrderDetailsSelect,
    });
  });

  return result;
};

const getPurchaseOrderReceipt = async (id: string) => {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      supplier: true,
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              barcode: true,
            },
          },
        },
      },
    },
  });

  if (!po) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Purchase order not found");
  }

  const receiptItems = po.items.map((item) => {
    const lineTotal = item.unitCost.mul(item.quantity);
    return {
      id: item.id,
      productId: item.productId,
      productName: item.product.name,
      sku: item.product.sku,
      barcode: item.product.barcode,
      quantity: item.quantity,
      unitCost: item.unitCost,
      lineTotal,
    };
  });

  return {
    poNumber: po.poNumber,
    status: po.status,
    supplier: {
      id: po.supplier.id,
      name: po.supplier.name,
      email: po.supplier.email,
      phone: po.supplier.phone,
      address: po.supplier.address,
    },
    createdBy: po.createdBy,
    note: po.note,
    totalCost: po.totalCost,
    orderedAt: po.orderedAt,
    receivedAt: po.receivedAt,
    createdAt: po.createdAt,
    items: receiptItems,
  };
};

export const PurchaseOrderServices = {
  createPurchaseOrder,
  getAllPurchaseOrders,
  getPurchaseOrderById,
  updatePurchaseOrder,
  updatePurchaseOrderStatus,
  receivePurchaseOrder,
  getPurchaseOrderReceipt,
};

export default PurchaseOrderServices;
