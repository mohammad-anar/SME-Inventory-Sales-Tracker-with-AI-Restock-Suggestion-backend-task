import { PaymentMethod, Prisma, Role, SaleStatus, StockMovementType } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import prisma from "../../config/prisma.js";
import ApiError from "../../utils/ApiError.js";
import {
  AuthenticatedUser,
  CreateSalePayload,
  SaleQueryOptions,
} from "./sales.interface.js";

const saleDetailsSelect = {
  id: true,
  invoiceNo: true,
  customerName: true,
  staffId: true,
  staff: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
  subtotal: true,
  discount: true,
  totalAmount: true,
  paymentMethod: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  items: {
    select: {
      id: true,
      productId: true,
      product: {
        select: {
          id: true,
          name: true,
          sku: true,
          barcode: true,
          avatar: true,
        },
      },
      quantity: true,
      unitPrice: true,
      unitCost: true,
      lineTotal: true,
      createdAt: true,
      updatedAt: true,
    },
  },
} as const;

const saleSummarySelect = {
  id: true,
  invoiceNo: true,
  customerName: true,
  staffId: true,
  staff: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
  subtotal: true,
  discount: true,
  totalAmount: true,
  paymentMethod: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      items: true,
    },
  },
} as const;

const generateUniqueInvoiceNumber = async (tx: Prisma.TransactionClient): Promise<string> => {
  const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  let attempts = 0;

  while (attempts < 10) {
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const candidate = `INV-${datePrefix}-${randomSuffix}`;
    const exists = await tx.sale.findUnique({
      where: { invoiceNo: candidate },
      select: { id: true },
    });

    if (!exists) {
      return candidate;
    }
    attempts++;
  }

  const timestampSuffix = Date.now().toString(36).toUpperCase();
  return `INV-${datePrefix}-${timestampSuffix}`;
};

const createSale = async (payload: CreateSalePayload, user: AuthenticatedUser) => {
  if (!payload.items || payload.items.length === 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Items array cannot be empty");
  }

  const productIds = payload.items.map((i) => i.productId.trim());
  const uniqueProductIds = new Set(productIds);

  if (uniqueProductIds.size !== productIds.length) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Duplicate product IDs in a single sale are not allowed",
    );
  }

  for (const item of payload.items) {
    if (!item.quantity || !Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Quantity must be a positive integer",
      );
    }
  }

  const result = await prisma.$transaction(async (tx) => {
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
      if (product.stockQty < item.quantity) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          `Insufficient stock for product "${product.name}". Available: ${product.stockQty}, Requested: ${item.quantity}`,
        );
      }
    }

    let subtotal = new Prisma.Decimal(0);
    const calculatedItems = payload.items.map((item) => {
      const product = productMap.get(item.productId.trim())!;
      const unitPrice = new Prisma.Decimal(product.unitPrice);
      const unitCost = new Prisma.Decimal(product.costPrice);
      const lineTotal = unitPrice.mul(item.quantity);
      subtotal = subtotal.add(lineTotal);
      return {
        productId: product.id,
        quantity: item.quantity,
        unitPrice,
        unitCost,
        lineTotal,
        productName: product.name,
      };
    });

    const discount = payload.discount
      ? new Prisma.Decimal(String(payload.discount))
      : new Prisma.Decimal(0);

    if (discount.isNegative()) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Discount cannot be negative",
      );
    }

    if (discount.gt(subtotal)) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Discount cannot exceed subtotal",
      );
    }

    const totalAmount = subtotal.sub(discount);

    for (const item of calculatedItems) {
      const updateStockResult = await tx.product.updateMany({
        where: {
          id: item.productId,
          stockQty: { gte: item.quantity },
          isActive: true,
        },
        data: {
          stockQty: { decrement: item.quantity },
        },
      });

      if (updateStockResult.count === 0) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          `Insufficient stock or concurrent modification for product "${item.productName}"`,
        );
      }
    }

    const invoiceNo = await generateUniqueInvoiceNumber(tx);

    const sale = await tx.sale.create({
      data: {
        invoiceNo,
        staffId: user.id,
        customerName: payload.customerName?.trim()
          ? payload.customerName.trim()
          : null,
        subtotal,
        discount,
        totalAmount,
        paymentMethod: payload.paymentMethod || PaymentMethod.CASH,
        status: SaleStatus.COMPLETED,
      },
    });

    for (const item of calculatedItems) {
      const saleItem = await tx.saleItem.create({
        data: {
          saleId: sale.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          unitCost: item.unitCost,
          lineTotal: item.lineTotal,
        },
      });

      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          type: StockMovementType.SALE,
          quantityChange: -item.quantity,
          saleItemId: saleItem.id,
          createdById: user.id,
          note: `Sale invoice ${invoiceNo}`,
        },
      });
    }

    return tx.sale.findUnique({
      where: { id: sale.id },
      select: saleDetailsSelect,
    });
  });

  return result;
};

const getAllSales = async (
  options: SaleQueryOptions,
  user: AuthenticatedUser,
) => {
  const MAX_LIMIT = 100;
  const page = Math.max(1, Number(options.page) || 1);
  const limit = Math.min(Math.max(1, Number(options.limit) || 10), MAX_LIMIT);
  const skip = (page - 1) * limit;

  const allowedSortFields = ["createdAt", "totalAmount"];

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

  if (user.role === Role.STAFF) {
    whereClause.staffId = user.id;
  } else if (options.staffId) {
    whereClause.staffId = options.staffId;
  }

  if (
    options.search &&
    typeof options.search === "string" &&
    options.search.trim().length > 0
  ) {
    whereClause.invoiceNo = {
      contains: options.search.trim(),
      mode: "insensitive",
    };
  }

  if (options.status) {
    if (!Object.values(SaleStatus).includes(options.status as SaleStatus)) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `Invalid sale status: ${options.status}`,
      );
    }
    whereClause.status = options.status as SaleStatus;
  }

  if (options.paymentMethod) {
    if (
      !Object.values(PaymentMethod).includes(
        options.paymentMethod as PaymentMethod,
      )
    ) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `Invalid payment method: ${options.paymentMethod}`,
      );
    }
    whereClause.paymentMethod = options.paymentMethod as PaymentMethod;
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
    prisma.sale.count({ where: whereClause }),
    prisma.sale.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy,
      select: saleSummarySelect,
    }),
  ]);

  const formattedData = data.map((sale) => ({
    id: sale.id,
    invoiceNo: sale.invoiceNo,
    customerName: sale.customerName,
    staffId: sale.staffId,
    staff: sale.staff,
    subtotal: sale.subtotal,
    discount: sale.discount,
    totalAmount: sale.totalAmount,
    paymentMethod: sale.paymentMethod,
    status: sale.status,
    itemCount: sale._count.items,
    createdAt: sale.createdAt,
    updatedAt: sale.updatedAt,
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

const getSaleById = async (id: string, user: AuthenticatedUser) => {
  const sale = await prisma.sale.findUnique({
    where: { id },
    select: saleDetailsSelect,
  });

  if (!sale) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Sale not found");
  }

  if (user.role === Role.STAFF && sale.staffId !== user.id) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "You don't have permission to access this sale",
    );
  }

  return sale;
};

const getSaleByInvoiceNo = async (
  invoiceNo: string,
  user: AuthenticatedUser,
) => {
  const sale = await prisma.sale.findUnique({
    where: { invoiceNo },
    select: saleDetailsSelect,
  });

  if (!sale) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Invoice not found");
  }

  if (user.role === Role.STAFF && sale.staffId !== user.id) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "You don't have permission to access this invoice",
    );
  }

  return sale;
};

const voidSale = async (id: string, user: AuthenticatedUser) => {
  const existingSale = await prisma.sale.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!existingSale) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Sale not found");
  }

  if (user.role === Role.STAFF && existingSale.staffId !== user.id) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "You don't have permission to void this sale",
    );
  }

  if (existingSale.status === SaleStatus.VOIDED) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Sale is already voided");
  }

  if (existingSale.status !== SaleStatus.COMPLETED) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Invalid sale status transition",
    );
  }

  const updatedSale = await prisma.$transaction(async (tx) => {
    const updateCount = await tx.sale.updateMany({
      where: {
        id,
        status: SaleStatus.COMPLETED,
      },
      data: {
        status: SaleStatus.VOIDED,
      },
    });

    if (updateCount.count === 0) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Sale is already voided or concurrently modified",
      );
    }

    for (const item of existingSale.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stockQty: { increment: item.quantity },
        },
      });

      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          type: StockMovementType.REVERSAL,
          quantityChange: item.quantity,
          saleItemId: item.id,
          createdById: user.id,
          note: `Void reversal for invoice ${existingSale.invoiceNo}`,
        },
      });
    }

    return tx.sale.findUnique({
      where: { id },
      select: saleDetailsSelect,
    });
  });

  return updatedSale;
};

export const SaleServices = {
  createSale,
  getAllSales,
  getSaleById,
  getSaleByInvoiceNo,
  voidSale,
};

export default SaleServices;
