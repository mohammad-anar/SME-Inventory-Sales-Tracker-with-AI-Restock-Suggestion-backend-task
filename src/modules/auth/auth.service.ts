import bcrypt from "bcryptjs";
import { Secret } from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import { Role } from "@prisma/client";
import env from "../../config/env.js";
import prisma from "../../config/prisma.js";
import ApiError from "../../utils/ApiError.js";
import { jwtHelper } from "../../utils/jwt.js";
import { ILoginResponse, ILoginUser, IRegisterUser } from "./auth.interface.js";

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

const loginUser = async (payload: ILoginUser): Promise<ILoginResponse> => {
  const normalizedEmail = payload.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  // Generic credential error to prevent email enumeration
  if (!user) {
    throw new ApiError(
      StatusCodes.UNAUTHORIZED,
      "Invalid email or password",
    );
  }

  // Deactivated user check
  if (!user.isActive) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "Your account has been deactivated. Please contact an administrator.",
    );
  }

  const isPasswordMatched = await bcrypt.compare(
    payload.password,
    user.passwordHash,
  );

  if (!isPasswordMatched) {
    throw new ApiError(
      StatusCodes.UNAUTHORIZED,
      "Invalid email or password",
    );
  }

  // Update last login timestamp
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
    select: userSafeSelect,
  });

  const jwtPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  const token = jwtHelper.createToken(
    jwtPayload,
    env.jwt.jwt_secret as Secret,
    (env.jwt.jwt_expire_in || "1d") as any,
  );

  return {
    token,
    user: updatedUser,
  };
};

const registerUser = async (
  payload: IRegisterUser,
): Promise<ILoginResponse> => {
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

  const saltRounds = Number(env.bcrypt_salt_round) || 12;
  const passwordHash = await bcrypt.hash(payload.password, saltRounds);

  const newUser = await prisma.user.create({
    data: {
      name: payload.name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: Role.STAFF,
      phone: payload.phone?.trim() ? payload.phone.trim() : null,
      avatar: payload.avatar ? payload.avatar : null,
      isActive: true,
      lastLoginAt: new Date(),
    },
    select: userSafeSelect,
  });

  const jwtPayload = {
    id: newUser.id,
    email: newUser.email,
    role: newUser.role,
  };

  const token = jwtHelper.createToken(
    jwtPayload,
    env.jwt.jwt_secret as Secret,
    (env.jwt.jwt_expire_in || "1d") as any,
  );

  return {
    token,
    user: newUser,
  };
};

const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userSafeSelect,
  });

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  if (!user.isActive) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "Your account has been deactivated",
    );
  }

  return user;
};

export const AuthService = {
  loginUser,
  registerUser,
  getMe,
};

export default AuthService;

