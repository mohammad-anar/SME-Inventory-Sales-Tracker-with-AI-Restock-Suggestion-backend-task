import { StatusCodes } from "http-status-codes";
import prisma from "../../config/prisma.js";
import ApiError from "../../utils/ApiError.js";
import {
  CategoryQueryOptions,
  CreateCategoryPayload,
  UpdateCategoryPayload,
  UpdateCategoryStatusPayload,
} from "./categories.interface.js";

const categorySelectedFields = {
  id: true,
  name: true,
  description: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

const createCategory = async (payload: CreateCategoryPayload) => {
  const name = payload.name.trim();

  const existingCategory = await prisma.category.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      isDeleted: false,
    },
  });

  if (existingCategory) {
    throw new ApiError(
      StatusCodes.CONFLICT,
      "Category with this name already exists",
    );
  }

  const result = await prisma.category.create({
    data: {
      name,
      description: payload.description ? payload.description.trim() : "",
      isActive: true,
      isDeleted: false,
    },
    select: categorySelectedFields,
  });

  return result;
};

const getAllCategories = async (options: CategoryQueryOptions) => {
  const MAX_LIMIT = 100;
  const page = Math.max(1, Number(options.page) || 1);
  const limit = Math.min(Math.max(1, Number(options.limit) || 10), MAX_LIMIT);
  const skip = (page - 1) * limit;

  const whereClause: {
    isDeleted: boolean;
    name?: { contains: string; mode: "insensitive" };
    isActive?: boolean;
  } = {
    isDeleted: false,
  };

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
    prisma.category.count({ where: whereClause }),
    prisma.category.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: categorySelectedFields,
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

const getCategoryById = async (id: string) => {
  const category = await prisma.category.findFirst({
    where: {
      id,
      isDeleted: false,
    },
    select: categorySelectedFields,
  });

  if (!category) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Category not found");
  }

  return category;
};

const updateCategory = async (id: string, payload: UpdateCategoryPayload) => {
  if (payload.name === undefined && payload.description === undefined) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "At least one field (name or description) must be provided for update",
    );
  }

  const existingCategory = await prisma.category.findFirst({
    where: {
      id,
      isDeleted: false,
    },
  });

  if (!existingCategory) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Category not found");
  }

  let normalizedName: string | undefined;
  if (payload.name !== undefined) {
    normalizedName = payload.name.trim();

    const duplicate = await prisma.category.findFirst({
      where: {
        name: { equals: normalizedName, mode: "insensitive" },
        isDeleted: false,
        NOT: { id },
      },
    });

    if (duplicate) {
      throw new ApiError(
        StatusCodes.CONFLICT,
        "Category with this name already exists",
      );
    }
  }

  const updatedCategory = await prisma.category.update({
    where: { id },
    data: {
      ...(normalizedName !== undefined && { name: normalizedName }),
      ...(payload.description !== undefined && {
        description: payload.description.trim(),
      }),
    },
    select: categorySelectedFields,
  });

  return updatedCategory;
};

const updateCategoryStatus = async (
  id: string,
  payload: UpdateCategoryStatusPayload,
) => {
  const existingCategory = await prisma.category.findFirst({
    where: {
      id,
      isDeleted: false,
    },
  });

  if (!existingCategory) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Category not found");
  }

  if (existingCategory.isActive === payload.isActive) {
    return {
      id: existingCategory.id,
      name: existingCategory.name,
      description: existingCategory.description,
      isActive: existingCategory.isActive,
      createdAt: existingCategory.createdAt,
      updatedAt: existingCategory.updatedAt,
    };
  }

  const updatedCategory = await prisma.category.update({
    where: { id },
    data: {
      isActive: payload.isActive,
    },
    select: categorySelectedFields,
  });

  return updatedCategory;
};

export const CategoryServices = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  updateCategoryStatus,
};

export default CategoryServices;
