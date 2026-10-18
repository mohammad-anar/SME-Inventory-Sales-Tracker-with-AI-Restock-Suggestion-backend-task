import { Prisma, Role, SaleStatus, StockMovementType } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import prisma from "../../config/prisma.js";
import ApiError from "../../utils/ApiError.js";
import {
  AuthenticatedUser,
  CreateSaleItemStandalonePayload,
  SaleItemQueryOptions,
  UpdateSaleItemPayload,
} from "./sale-items.interface.js";

const saleItemSelectedFields = {
  id: true,
  saleId: true,
  sale: {
    select: {
      id: true,
      invoiceNo: true,
      customerName: true,
      staffId: true,
      status: true,
      subtotal: true,
      discount: true,
      totalAmount: true,
      createdAt: true,
    },
  },
  productId: true,
  product: {
    select: {
      id: true,
      name: true,
      sku: true,
      barcode: true,
      avatar: true,
      stockQty: true,
    },
  },
  quantity: true,
  unitPrice: true,
  unitCost: true,
  lineTotal: true,
  createdAt: true,
  updatedAt: true,
} as const;

const createSaleItem = async (
  payload: CreateSaleItemStandalonePayload,
  user: AuthenticatedUser,
) => {
  const saleId = payload.saleId.trim();
  const productId = payload.productId.trim();
  const quantity = payload.quantity;

  const result = await prisma.$transaction(async (tx) => {
    const sale = await tx.sale.findUnique({
      where: { id: saleId },
    });

    if (!sale) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Sale not found");
    }

    if (user.role === Role.STAFF && sale.staffId !== user.id) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        "You don't have permission to modify this sale",
      );
    }

    if (sale.status === SaleStatus.VOIDED) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Cannot add items to a voided sale",
      );
    }

    const existingItem = await tx.saleItem.findUnique({
      where: {
        saleId_productId: {
          saleId,
          productId,
        },
      },
    });

    if (existingItem) {
      throw new ApiError(
        StatusCodes.CONFLICT,
        "Product already exists in this sale. Use update endpoint to modify its quantity",
      );
    }

    const product = await tx.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Product not found");
    }

    if (!product.isActive) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `Product "${product.name}" is inactive`,
      );
    }

    if (product.stockQty < quantity) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `Insufficient stock for product "${product.name}". Available: ${product.stockQty}, Requested: ${quantity}`,
      );
    }

    const updateStock = await tx.product.updateMany({
      where: {
        id: productId,
        stockQty: { gte: quantity },
        isActive: true,
      },
      data: {
        stockQty: { decrement: quantity },
      },
    });

    if (updateStock.count === 0) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `Insufficient stock or concurrent modification for product "${product.name}"`,
      );
    }

    const unitPrice = new Prisma.Decimal(product.unitPrice);
    const unitCost = new Prisma.Decimal(product.costPrice);
    const lineTotal = unitPrice.mul(quantity);

    const createdItem = await tx.saleItem.create({
      data: {
        saleId,
        productId,
        quantity,
        unitPrice,
        unitCost,
        lineTotal,
      },
    });

    await tx.stockMovement.create({
      data: {
        productId,
        type: StockMovementType.SALE,
        quantityChange: -quantity,
        saleItemId: createdItem.id,
        createdById: user.id,
        note: `Added item to invoice ${sale.invoiceNo}`,
      },
    });

    const newSubtotal = sale.subtotal.add(lineTotal);
    const newTotalAmount = newSubtotal.sub(sale.discount);

    await tx.sale.update({
      where: { id: saleId },
      data: {
        subtotal: newSubtotal,
        totalAmount: newTotalAmount,
      },
    });

    return tx.saleItem.findUnique({
      where: { id: createdItem.id },
      select: saleItemSelectedFields,
    });
  });

  return result;
};

const getAllSaleItems = async (
  options: SaleItemQueryOptions,
  user: AuthenticatedUser,
) => {
  const MAX_LIMIT = 100;
  const page = Math.max(1, Number(options.page) || 1);
  const limit = Math.min(Math.max(1, Number(options.limit) || 10), MAX_LIMIT);
  const skip = (page - 1) * limit;

  const allowedSortFields = ["createdAt", "quantity", "lineTotal", "unitPrice"];

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
    whereClause.sale = { staffId: user.id };
  }

  if (options.saleId) {
    whereClause.saleId = options.saleId;
  }

  if (options.productId) {
    whereClause.productId = options.productId;
  }

  if (
    options.search &&
    typeof options.search === "string" &&
    options.search.trim().length > 0
  ) {
    const term = options.search.trim();
    whereClause.OR = [
      { product: { name: { contains: term, mode: "insensitive" } } },
      { product: { sku: { contains: term, mode: "insensitive" } } },
      { sale: { invoiceNo: { contains: term, mode: "insensitive" } } },
    ];
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
    prisma.saleItem.count({ where: whereClause }),
    prisma.saleItem.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy,
      select: saleItemSelectedFields,
    }),
  ]);

  return {
    pagination: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data,
  };
};

const getSaleItemById = async (id: string, user: AuthenticatedUser) => {
  const item = await prisma.saleItem.findUnique({
    where: { id },
    select: saleItemSelectedFields,
  });

  if (!item) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Sale item not found");
  }

  if (user.role === Role.STAFF && item.sale.staffId !== user.id) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "You don't have permission to access this sale item",
    );
  }

  return item;
};

const updateSaleItem = async (
  id: string,
  payload: UpdateSaleItemPayload,
  user: AuthenticatedUser,
) => {
  const newQuantity = payload.quantity;

  const result = await prisma.$transaction(async (tx) => {
    const existingItem = await tx.saleItem.findUnique({
      where: { id },
      include: {
        sale: true,
        product: true,
      },
    });

    if (!existingItem) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Sale item not found");
    }

    if (user.role === Role.STAFF && existingItem.sale.staffId !== user.id) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        "You don't have permission to modify this sale item",
      );
    }

    if (existingItem.sale.status === SaleStatus.VOIDED) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Cannot modify items of a voided sale",
      );
    }

    if (newQuantity === existingItem.quantity) {
      return tx.saleItem.findUnique({
        where: { id },
        select: saleItemSelectedFields,
      });
    }

    const diff = newQuantity - existingItem.quantity;

    if (diff > 0) {
      if (!existingItem.product.isActive) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          `Product "${existingItem.product.name}" is inactive`,
        );
      }

      const updateStock = await tx.product.updateMany({
        where: {
          id: existingItem.productId,
          stockQty: { gte: diff },
          isActive: true,
        },
        data: {
          stockQty: { decrement: diff },
        },
      });

      if (updateStock.count === 0) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          `Insufficient stock to increase quantity for product "${existingItem.product.name}"`,
        );
      }

      await tx.stockMovement.create({
        data: {
          productId: existingItem.productId,
          type: StockMovementType.SALE,
          quantityChange: -diff,
          saleItemId: existingItem.id,
          createdById: user.id,
          note: `Increased item quantity in invoice ${existingItem.sale.invoiceNo}`,
        },
      });
    } else {
      const restoreAmount = Math.abs(diff);

      await tx.product.update({
        where: { id: existingItem.productId },
        data: {
          stockQty: { increment: restoreAmount },
        },
      });

      await tx.stockMovement.create({
        data: {
          productId: existingItem.productId,
          type: StockMovementType.REVERSAL,
          quantityChange: restoreAmount,
          saleItemId: existingItem.id,
          createdById: user.id,
          note: `Decreased item quantity in invoice ${existingItem.sale.invoiceNo}`,
        },
      });
    }

    const newLineTotal = existingItem.unitPrice.mul(newQuantity);
    const lineTotalDiff = newLineTotal.sub(existingItem.lineTotal);
    const newSubtotal = existingItem.sale.subtotal.add(lineTotalDiff);

    if (existingItem.sale.discount.gt(newSubtotal)) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Discount cannot exceed new subtotal",
      );
    }

    const newTotalAmount = newSubtotal.sub(existingItem.sale.discount);

    await tx.saleItem.update({
      where: { id },
      data: {
        quantity: newQuantity,
        lineTotal: newLineTotal,
      },
    });

    await tx.sale.update({
      where: { id: existingItem.saleId },
      data: {
        subtotal: newSubtotal,
        totalAmount: newTotalAmount,
      },
    });

    return tx.saleItem.findUnique({
      where: { id },
      select: saleItemSelectedFields,
    });
  });

  return result;
};

const deleteSaleItem = async (id: string, user: AuthenticatedUser) => {
  const result = await prisma.$transaction(async (tx) => {
    const existingItem = await tx.saleItem.findUnique({
      where: { id },
      include: {
        sale: true,
      },
    });

    if (!existingItem) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Sale item not found");
    }

    if (user.role === Role.STAFF && existingItem.sale.staffId !== user.id) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        "You don't have permission to delete this sale item",
      );
    }

    if (existingItem.sale.status === SaleStatus.VOIDED) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Cannot delete items from a voided sale",
      );
    }

    const itemCount = await tx.saleItem.count({
      where: { saleId: existingItem.saleId },
    });

    if (itemCount <= 1) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Cannot delete the only item in a sale. Void the sale instead",
      );
    }

    const newSubtotal = existingItem.sale.subtotal.sub(existingItem.lineTotal);

    if (existingItem.sale.discount.gt(newSubtotal)) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Cannot delete item because discount would exceed remaining subtotal",
      );
    }

    const newTotalAmount = newSubtotal.sub(existingItem.sale.discount);

    await tx.product.update({
      where: { id: existingItem.productId },
      data: {
        stockQty: { increment: existingItem.quantity },
      },
    });

    await tx.stockMovement.updateMany({
      where: { saleItemId: id },
      data: { saleItemId: null },
    });

    await tx.stockMovement.create({
      data: {
        productId: existingItem.productId,
        type: StockMovementType.REVERSAL,
        quantityChange: existingItem.quantity,
        createdById: user.id,
        note: `Deleted item from invoice ${existingItem.sale.invoiceNo}`,
      },
    });

    await tx.saleItem.delete({
      where: { id },
    });

    await tx.sale.update({
      where: { id: existingItem.saleId },
      data: {
        subtotal: newSubtotal,
        totalAmount: newTotalAmount,
      },
    });

    return {
      id,
      saleId: existingItem.saleId,
      message: "Sale item deleted successfully",
    };
  });

  return result;
};

export const SaleItemServices = {
  createSaleItem,
  getAllSaleItems,
  getSaleItemById,
  updateSaleItem,
  deleteSaleItem,
};

export default SaleItemServices;
