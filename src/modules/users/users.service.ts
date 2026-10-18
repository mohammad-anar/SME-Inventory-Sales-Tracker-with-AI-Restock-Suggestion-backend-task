import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import env from "../../config/env.js";
import prisma from "../../config/prisma.js";
import ApiError from "../../utils/ApiError.js";
import {
  CreateUserPayload,
  UpdatePasswordPayload,
  UpdateProfilePayload,
  UpdateUserPayload,
  UserQueryOptions,
} from "./users.interface.js";

export const userSafeSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  phone: true,
  avatar: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

const createUser = async (payload: CreateUserPayload) => {
  const normalizedEmail = payload.email.trim().toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw new ApiError(
      StatusCodes.CONFLICT,
      "User with this email already exists",
    );
  }

  const hashedPassword = await bcrypt.hash(
    payload.password,
    env.bcrypt_salt_round || 10,
  );

  const newUser = await prisma.user.create({
    data: {
      name: payload.name.trim(),
      email: normalizedEmail,
      passwordHash: hashedPassword,
      role: payload.role || Role.STAFF,
      phone: payload.phone || null,
      avatar: payload.avatar || null,
      isActive: true,
    },
    select: userSafeSelect,
  });

  return newUser;
};

const getAllUsers = async (options: UserQueryOptions) => {
  const page = Math.max(1, Number(options.page) || 1);
  const limit = Math.max(1, Number(options.limit) || 10);
  const skip = (page - 1) * limit;

  const whereClause: any = {};

  if (options.search && options.search.trim()) {
    const search = options.search.trim();
    whereClause.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const [total, data] = await Promise.all([
    prisma.user.count({ where: whereClause }),
    prisma.user.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: userSafeSelect,
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

const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: userSafeSelect,
  });

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  return user;
};

const updateUser = async (id: string, payload: UpdateUserPayload) => {
  const targetUser = await prisma.user.findUnique({
    where: { id },
  });

  if (!targetUser) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  // Prevent deactivation or demotion of the last active Admin
  if (
    targetUser.role === Role.ADMIN &&
    (payload.isActive === false || payload.role === Role.STAFF)
  ) {
    const activeAdminCount = await prisma.user.count({
      where: { role: Role.ADMIN, isActive: true },
    });

    if (activeAdminCount <= 1) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Cannot deactivate or demote the only remaining active Admin",
      );
    }
  }

  // Email duplicate check if email is being updated
  if (payload.email) {
    const normalizedEmail = payload.email.trim().toLowerCase();
    const emailConflict = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        NOT: { id },
      },
    });

    if (emailConflict) {
      throw new ApiError(
        StatusCodes.CONFLICT,
        "User with this email already exists",
      );
    }
    payload.email = normalizedEmail;
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      ...(payload.name && { name: payload.name.trim() }),
      ...(payload.email && { email: payload.email }),
      ...(payload.role !== undefined && { role: payload.role }),
      ...(payload.isActive !== undefined && { isActive: payload.isActive }),
      ...(payload.phone !== undefined && { phone: payload.phone }),
      ...(payload.avatar !== undefined && { avatar: payload.avatar }),
    },
    select: userSafeSelect,
  });

  return updatedUser;
};

const updateUserPassword = async (id: string, payload: UpdatePasswordPayload) => {
  const targetUser = await prisma.user.findUnique({
    where: { id },
  });

  if (!targetUser) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  const hashedPassword = await bcrypt.hash(
    payload.newPassword,
    env.bcrypt_salt_round || 10,
  );

  await prisma.user.update({
    where: { id },
    data: {
      passwordHash: hashedPassword,
    },
  });

  return { message: "Password updated successfully" };
};

const updateProfile = async (userId: string, payload: UpdateProfilePayload) => {
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!targetUser) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(payload.name && { name: payload.name.trim() }),
      ...(payload.phone !== undefined && { phone: payload.phone }),
      ...(payload.avatar !== undefined && { avatar: payload.avatar }),
    },
    select: userSafeSelect,
  });

  return updatedUser;
};

export const UserServices = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  updateUserPassword,
  updateProfile,
};

export default UserServices;
