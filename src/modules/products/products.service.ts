import { Prisma, Role } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import prisma from "../../config/prisma.js";
import ApiError from "../../utils/ApiError.js";
import {
  CreateProductPayload,
  LowStockQueryOptions,
  ProductQueryOptions,
  UpdateProductPayload,
  UpdateProductStatusPayload,
} from "./products.interface.js";

const productSelectedFields = {
  id: true,
  sku: true,
  name: true,
  description: true,
  barcode: true,
  categoryId: true,
  category: {
    select: {
      id: true,
      name: true,
    },
  },
  supplierId: true,
  supplier: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
    },
  },
  avatar: true,
  unitPrice: true,
  costPrice: true,
  stockQty: true,
  reorderLevel: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

const createProduct = async (payload: CreateProductPayload) => {
  const sku = payload.sku.trim();
  const name = payload.name.trim();
  const description = payload.description?.trim()
    ? payload.description.trim()
    : "";
  const barcode = payload.barcode?.trim() ? payload.barcode.trim() : "";
  const avatar = payload.avatar?.trim() ? payload.avatar.trim() : null;

  const existingSku = await prisma.product.findUnique({
    where: { sku },
  });

  if (existingSku) {
    throw new ApiError(
      StatusCodes.CONFLICT,
      "Product with this SKU already exists",
    );
  }

  if (barcode && barcode.length > 0) {
    const existingBarcode = await prisma.product.findFirst({
      where: { barcode },
    });

    if (existingBarcode) {
      throw new ApiError(
        StatusCodes.CONFLICT,
        "Product with this barcode already exists",
      );
    }
  }

  const category = await prisma.category.findFirst({
    where: { id: payload.categoryId, isDeleted: false },
  });

  if (!category) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Category not found");
  }

  if (!category.isActive) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Cannot assign an inactive category",
    );
  }

  const supplier = await prisma.supplier.findUnique({
    where: { id: payload.supplierId },
  });

  if (!supplier) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Supplier not found");
  }

  if (!supplier.isActive) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Cannot assign an inactive supplier",
    );
  }

  const unitPriceNum = Number(payload.unitPrice);
  const costPriceNum = Number(payload.costPrice);

  if (isNaN(unitPriceNum) || unitPriceNum < 0) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Unit price must be a non-negative number",
    );
  }

  if (isNaN(costPriceNum) || costPriceNum < 0) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Cost price must be a non-negative number",
    );
  }

  let reorderLevel = 10;
  if (payload.reorderLevel !== undefined) {
    const parsedReorderLevel = Number(payload.reorderLevel);
    if (
      isNaN(parsedReorderLevel) ||
      !Number.isInteger(parsedReorderLevel) ||
      parsedReorderLevel < 0
    ) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Reorder level must be a non-negative integer",
      );
    }
    reorderLevel = parsedReorderLevel;
  }

  const result = await prisma.product.create({
    data: {
      sku,
      name,
      description,
      barcode,
      categoryId: payload.categoryId,
      supplierId: payload.supplierId,
      avatar,
      unitPrice: new Prisma.Decimal(String(payload.unitPrice)),
      costPrice: new Prisma.Decimal(String(payload.costPrice)),
      stockQty: 0,
      reorderLevel,
      isActive: true,
    },
    select: productSelectedFields,
  });

  return result;
};

const getAllProducts = async (options: ProductQueryOptions) => {
  const MAX_LIMIT = 100;
  const page = Math.max(1, Number(options.page) || 1);
  const limit = Math.min(Math.max(1, Number(options.limit) || 10), MAX_LIMIT);
  const skip = (page - 1) * limit;

  const allowedSortFields = [
    "name",
    "sku",
    "stockQty",
    "unitPrice",
    "costPrice",
    "createdAt",
    "updatedAt",
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
    const search = options.search.trim();
    whereClause.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
      { barcode: { contains: search, mode: "insensitive" } },
    ];
  }

  if (options.categoryId) {
    whereClause.categoryId = options.categoryId;
  }

  if (options.supplierId) {
    whereClause.supplierId = options.supplierId;
  }

  if (options.isActive !== undefined) {
    if (options.isActive === "true" || options.isActive === true) {
      whereClause.isActive = true;
    } else if (options.isActive === "false" || options.isActive === false) {
      whereClause.isActive = false;
    }
  }

  if (options.stockStatus === "out-of-stock") {
    whereClause.stockQty = 0;
  } else if (options.stockStatus === "low-stock") {
    const lowStockRecords = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM products WHERE "stockQty" <= "reorderLevel"
    `;
    const lowStockIds = lowStockRecords.map((r) => r.id);
    whereClause.id = { in: lowStockIds };
  }

  const [total, data] = await Promise.all([
    prisma.product.count({ where: whereClause }),
    prisma.product.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy,
      select: productSelectedFields,
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

const getLowStockProducts = async (
  options: LowStockQueryOptions,
  user?: { role?: string },
) => {
  const MAX_LIMIT = 100;
  const page = Math.max(1, Number(options.page) || 1);
  const limit = Math.min(Math.max(1, Number(options.limit) || 10), MAX_LIMIT);
  const skip = (page - 1) * limit;

  const lowStockRecords = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM products WHERE "stockQty" <= "reorderLevel"
  `;
  const lowStockIds = lowStockRecords.map((r) => r.id);

  const whereClause: any = {
    id: { in: lowStockIds },
  };

  if (options.categoryId) {
    whereClause.categoryId = options.categoryId;
  }

  if (options.supplierId) {
    whereClause.supplierId = options.supplierId;
  }

  if (options.stockStatus === "out-of-stock") {
    whereClause.stockQty = 0;
  }

  if (options.isActive !== undefined) {
    if (user?.role === Role.ADMIN) {
      if (options.isActive === "true" || options.isActive === true) {
        whereClause.isActive = true;
      } else if (options.isActive === "false" || options.isActive === false) {
        whereClause.isActive = false;
      }
    } else {
      whereClause.isActive = true;
    }
  } else {
    whereClause.isActive = true;
  }

  const [total, data] = await Promise.all([
    prisma.product.count({ where: whereClause }),
    prisma.product.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { stockQty: "asc" },
      select: productSelectedFields,
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

const getProductById = async (id: string) => {
  const product = await prisma.product.findUnique({
    where: { id },
    select: productSelectedFields,
  });

  if (!product) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Product not found");
  }

  return product;
};

const updateProduct = async (id: string, payload: UpdateProductPayload) => {
  if (!payload || Object.keys(payload).length === 0) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "At least one field must be provided for update",
    );
  }

  if ("stockQty" in payload || "isActive" in payload) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "stockQty and isActive cannot be modified through this endpoint",
    );
  }

  const existingProduct = await prisma.product.findUnique({
    where: { id },
  });

  if (!existingProduct) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Product not found");
  }

  const updateData: Prisma.ProductUpdateInput = {};

  if (payload.sku !== undefined) {
    const sku = payload.sku.trim();
    if (!sku) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "SKU cannot be empty");
    }

    const duplicate = await prisma.product.findFirst({
      where: { sku, NOT: { id } },
    });

    if (duplicate) {
      throw new ApiError(
        StatusCodes.CONFLICT,
        "Product with this SKU already exists",
      );
    }

    updateData.sku = sku;
  }

  if (payload.name !== undefined) {
    const name = payload.name.trim();
    if (!name) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Product name cannot be empty",
      );
    }
    updateData.name = name;
  }

  if (payload.description !== undefined) {
    updateData.description = payload.description
      ? payload.description.trim()
      : "";
  }

  if (payload.barcode !== undefined) {
    const barcode = payload.barcode ? payload.barcode.trim() : "";
    if (barcode && barcode.length > 0) {
      const duplicateBarcode = await prisma.product.findFirst({
        where: { barcode, NOT: { id } },
      });

      if (duplicateBarcode) {
        throw new ApiError(
          StatusCodes.CONFLICT,
          "Product with this barcode already exists",
        );
      }
    }
    updateData.barcode = barcode;
  }

  if (payload.categoryId !== undefined) {
    const category = await prisma.category.findFirst({
      where: { id: payload.categoryId, isDeleted: false },
    });

    if (!category) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Category not found");
    }

    if (!category.isActive) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Cannot assign an inactive category",
      );
    }

    updateData.category = { connect: { id: payload.categoryId } };
  }

  if (payload.supplierId !== undefined) {
    const supplier = await prisma.supplier.findUnique({
      where: { id: payload.supplierId },
    });

    if (!supplier) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Supplier not found");
    }

    if (!supplier.isActive) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Cannot assign an inactive supplier",
      );
    }

    updateData.supplier = { connect: { id: payload.supplierId } };
  }

  if (payload.avatar !== undefined) {
    updateData.avatar = payload.avatar ? payload.avatar.trim() : null;
  }

  if (payload.unitPrice !== undefined) {
    const unitPriceNum = Number(payload.unitPrice);
    if (isNaN(unitPriceNum) || unitPriceNum < 0) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Unit price must be a non-negative number",
      );
    }
    updateData.unitPrice = new Prisma.Decimal(String(payload.unitPrice));
  }

  if (payload.costPrice !== undefined) {
    const costPriceNum = Number(payload.costPrice);
    if (isNaN(costPriceNum) || costPriceNum < 0) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Cost price must be a non-negative number",
      );
    }
    updateData.costPrice = new Prisma.Decimal(String(payload.costPrice));
  }

  if (payload.reorderLevel !== undefined) {
    const reorderLevelNum = Number(payload.reorderLevel);
    if (
      isNaN(reorderLevelNum) ||
      !Number.isInteger(reorderLevelNum) ||
      reorderLevelNum < 0
    ) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Reorder level must be a non-negative integer",
      );
    }
    updateData.reorderLevel = reorderLevelNum;
  }

  const updatedProduct = await prisma.product.update({
    where: { id },
    data: updateData,
    select: productSelectedFields,
  });

  return updatedProduct;
};

const updateProductStatus = async (
  id: string,
  payload: UpdateProductStatusPayload,
) => {
  const existingProduct = await prisma.product.findUnique({
    where: { id },
  });

  if (!existingProduct) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Product not found");
  }

  if (existingProduct.isActive === payload.isActive) {
    return prisma.product.findUnique({
      where: { id },
      select: productSelectedFields,
    });
  }

  const updatedProduct = await prisma.product.update({
    where: { id },
    data: {
      isActive: payload.isActive,
    },
    select: productSelectedFields,
  });

  return updatedProduct;
};

const validateProductForTransaction = async (productId: string) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Product not found");
  }

  if (!product.isActive) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Cannot select a deactivated product for transactions",
    );
  }

  return product;
};

export const ProductServices = {
  createProduct,
  getAllProducts,
  getLowStockProducts,
  getProductById,
  updateProduct,
  updateProductStatus,
  validateProductForTransaction,
};

export default ProductServices;
