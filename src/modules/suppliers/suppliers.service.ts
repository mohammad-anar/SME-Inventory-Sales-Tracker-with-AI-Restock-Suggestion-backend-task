import { StatusCodes } from "http-status-codes";
import prisma from "../../config/prisma.js";
import ApiError from "../../utils/ApiError.js";
import {
  CreateSupplierPayload,
  SupplierQueryOptions,
  UpdateSupplierPayload,
  UpdateSupplierStatusPayload,
} from "./suppliers.interface.js";

const supplierSelectedFields = {
  id: true,
  name: true,
  email: true,
  phone: true,
  address: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

const createSupplier = async (payload: CreateSupplierPayload) => {
  const name = payload.name.trim();
  const phone = payload.phone?.trim() ? payload.phone.trim() : null;
  const email = payload.email?.trim() ? payload.email.trim().toLowerCase() : null;
  const address = payload.address?.trim() ? payload.address.trim() : null;

  const result = await prisma.supplier.create({
    data: {
      name,
      phone,
      email,
      address,
      isActive: true,
    },
    select: supplierSelectedFields,
  });

  return result;
};

const getAllSuppliers = async (options: SupplierQueryOptions) => {
  const MAX_LIMIT = 100;
  const page = Math.max(1, Number(options.page) || 1);
  const limit = Math.min(Math.max(1, Number(options.limit) || 10), MAX_LIMIT);
  const skip = (page - 1) * limit;

  const whereClause: {
    name?: { contains: string; mode: "insensitive" };
    isActive?: boolean;
  } = {};

  if (
    options.search &&
    typeof options.search === "string" &&
    options.search.trim().length > 0
  ) {
    whereClause.name = {
      contains: options.search.trim(),
      mode: "insensitive",
    };
  }

  if (options.isActive !== undefined) {
    if (options.isActive === "true" || options.isActive === true) {
      whereClause.isActive = true;
    } else if (options.isActive === "false" || options.isActive === false) {
      whereClause.isActive = false;
    }
  }

  const [total, data] = await Promise.all([
    prisma.supplier.count({ where: whereClause }),
    prisma.supplier.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: supplierSelectedFields,
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

const getSupplierById = async (id: string) => {
  const supplier = await prisma.supplier.findUnique({
    where: { id },
    select: supplierSelectedFields,
  });

  if (!supplier) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Supplier not found");
  }

  return supplier;
};

const updateSupplier = async (id: string, payload: UpdateSupplierPayload) => {
  if (
    payload.name === undefined &&
    payload.phone === undefined &&
    payload.email === undefined &&
    payload.address === undefined
  ) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "At least one field must be provided for update",
    );
  }

  const existingSupplier = await prisma.supplier.findUnique({
    where: { id },
  });

  if (!existingSupplier) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Supplier not found");
  }

  const updateData: {
    name?: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
  } = {};

  if (payload.name !== undefined) {
    updateData.name = payload.name.trim();
  }

  if (payload.phone !== undefined) {
    updateData.phone = payload.phone?.trim() ? payload.phone.trim() : null;
  }

  if (payload.email !== undefined) {
    updateData.email = payload.email?.trim()
      ? payload.email.trim().toLowerCase()
      : null;
  }

  if (payload.address !== undefined) {
    updateData.address = payload.address?.trim()
      ? payload.address.trim()
      : null;
  }

  const updatedSupplier = await prisma.supplier.update({
    where: { id },
    data: updateData,
    select: supplierSelectedFields,
  });

  return updatedSupplier;
};

const updateSupplierStatus = async (
  id: string,
  payload: UpdateSupplierStatusPayload,
) => {
  const existingSupplier = await prisma.supplier.findUnique({
    where: { id },
  });

  if (!existingSupplier) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Supplier not found");
  }

  if (existingSupplier.isActive === payload.isActive) {
    return {
      id: existingSupplier.id,
      name: existingSupplier.name,
      email: existingSupplier.email,
      phone: existingSupplier.phone,
      address: existingSupplier.address,
      isActive: existingSupplier.isActive,
      createdAt: existingSupplier.createdAt,
      updatedAt: existingSupplier.updatedAt,
    };
  }

  const updatedSupplier = await prisma.supplier.update({
    where: { id },
    data: {
      isActive: payload.isActive,
    },
    select: supplierSelectedFields,
  });

  return updatedSupplier;
};

const validateSupplierForPurchase = async (supplierId: string) => {
  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId },
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

  return supplier;
};

export const SupplierServices = {
  createSupplier,
  getAllSuppliers,
  getSupplierById,
  updateSupplier,
  updateSupplierStatus,
  validateSupplierForPurchase,
};

export default SupplierServices;
