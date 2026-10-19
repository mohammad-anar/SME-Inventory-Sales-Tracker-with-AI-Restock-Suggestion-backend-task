import { Prisma, StockMovementType } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import prisma from "../../config/prisma.js";
import ApiError from "../../utils/ApiError.js";
import {
  ManualStockAdjustmentPayload,
  StockMovementQueryParams,
} from "./stock-movements.interface.js";

const stockMovementSelectedFields = {
  id: true,
  productId: true,
  type: true,
  quantityChange: true,
  note: true,
  saleItemId: true,
  purchaseOrderItemId: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  product: {
    select: {
      id: true,
      name: true,
      sku: true,
      stockQty: true,
      unitPrice: true,
      category: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
  createdBy: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
} as const;

const getStockMovements = async (options: StockMovementQueryParams) => {
  const page = Math.max(1, Number(options.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(options.limit) || 10));
  const skip = (page - 1) * limit;

  const where: Prisma.StockMovementWhereInput = {};

  if (options.productId && options.productId.trim()) {
    where.productId = options.productId.trim();
  }

  if (options.type && options.type.trim()) {
    const rawType = options.type.trim().toUpperCase();
    if (Object.values(StockMovementType).includes(rawType as StockMovementType)) {
      where.type = rawType as StockMovementType;
    }
  }

  if (options.startDate || options.endDate) {
    where.createdAt = {};
    if (options.startDate) {
      where.createdAt.gte = new Date(options.startDate);
    }
    if (options.endDate) {
      const end = new Date(options.endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

  const [data, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      select: stockMovementSelectedFields,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.stockMovement.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
    data,
  };
};

const getStockMovementById = async (id: string) => {
  const movement = await prisma.stockMovement.findUnique({
    where: { id },
    select: stockMovementSelectedFields,
  });

  if (!movement) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Stock movement record not found");
  }

  return movement;
};

const adjustStock = async (payload: ManualStockAdjustmentPayload, userId: string) => {
  const result = await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({
      where: { id: payload.productId },
      select: { id: true, name: true, sku: true, stockQty: true },
    });

    if (!product) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Product not found");
    }

    const newStock = product.stockQty + payload.quantityChange;

    if (newStock < 0) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `Adjustment would result in negative stock. Current: ${product.stockQty}, Change: ${payload.quantityChange}`,
      );
    }

    await tx.product.update({
      where: { id: product.id },
      data: { stockQty: newStock },
    });

    const movement = await tx.stockMovement.create({
      data: {
        productId: product.id,
        type: StockMovementType.ADJUSTMENT,
        quantityChange: payload.quantityChange,
        note: payload.note || "Manual stock adjustment",
        createdById: userId,
      },
      select: stockMovementSelectedFields,
    });

    return movement;
  });

  return result;
};

export const StockMovementService = {
  getStockMovements,
  getStockMovementById,
  adjustStock,
};

export default StockMovementService;
