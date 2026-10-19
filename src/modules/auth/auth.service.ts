import crypto from "crypto";
import bcrypt from "bcryptjs";
import { Secret } from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import env from "../../config/env.js";
import prisma from "../../config/prisma.js";
import ApiError from "../../utils/ApiError.js";
import { jwtHelper } from "../../utils/jwt.js";
import {
  ILoginResponse,
  ILoginUser,
  IRegisterUser,
  ISetPasswordPayload,
  IVerifySetupTokenResponse,
} from "./auth.interface.js";

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

  if (!user) {
    throw new ApiError(
      StatusCodes.UNAUTHORIZED,
      "Invalid email or password",
    );
  }

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
  _payload: IRegisterUser,
): Promise<ILoginResponse> => {
  throw new ApiError(
    StatusCodes.FORBIDDEN,
    "Public registration is disabled. Staff accounts must be created by an administrator.",
  );
};

const verifySetupToken = async (
  token: string,
): Promise<IVerifySetupTokenResponse> => {
  const tokenHash = crypto
    .createHash("sha256")
    .update(token.trim())
    .digest("hex");

  const user = await prisma.user.findFirst({
    where: { setupTokenHash: tokenHash },
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      setupTokenExpiresAt: true,
    },
  });

  if (!user) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Invalid or already used setup link.",
    );
  }

  if (!user.isActive) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "This account has been deactivated. Please contact an administrator.",
    );
  }

  if (user.setupTokenExpiresAt && new Date() > user.setupTokenExpiresAt) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "This setup link has expired. Please contact an administrator to request a new setup link.",
    );
  }

  return {
    valid: true,
    email: user.email,
    name: user.name,
  };
};

const setPassword = async (
  payload: ISetPasswordPayload,
): Promise<ILoginResponse> => {
  const tokenHash = crypto
    .createHash("sha256")
    .update(payload.token.trim())
    .digest("hex");

  const user = await prisma.user.findFirst({
    where: { setupTokenHash: tokenHash },
  });

  if (!user) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Invalid or already used setup link.",
    );
  }

  if (!user.isActive) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "This account has been deactivated. Please contact an administrator.",
    );
  }

  if (user.setupTokenExpiresAt && new Date() > user.setupTokenExpiresAt) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "This setup link has expired. Please contact an administrator to request a new setup link.",
    );
  }

  const saltRounds = Number(env.bcrypt_salt_round) || 12;
  const newPasswordHash = await bcrypt.hash(payload.password, saltRounds);

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: newPasswordHash,
      setupTokenHash: null,
      setupTokenExpiresAt: null,
      lastLoginAt: new Date(),
    },
    select: userSafeSelect,
  });

  const jwtPayload = {
    id: updatedUser.id,
    email: updatedUser.email,
    role: updatedUser.role,
  };

  const jwtToken = jwtHelper.createToken(
    jwtPayload,
    env.jwt.jwt_secret as Secret,
    (env.jwt.jwt_expire_in || "1d") as any,
  );

  return {
    token: jwtToken,
    user: updatedUser,
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
  verifySetupToken,
  setPassword,
  getMe,
};

export default AuthService;
