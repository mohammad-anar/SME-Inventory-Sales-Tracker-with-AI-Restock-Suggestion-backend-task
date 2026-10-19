import { StatusCodes } from "http-status-codes";
import jwt, { JwtPayload } from "jsonwebtoken";
import prisma from "../../config/prisma.js";
import ApiError from "../../utils/ApiError.js";
import { hashToken } from "../../utils/tokenHash.js";

const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  try {
    const tokenHash = hashToken(token);
    const blacklisted = await prisma.blacklistedToken.findUnique({
      where: { tokenHash },
      select: { id: true },
    });
    return Boolean(blacklisted);
  } catch (error) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Security verification failed: database unavailable",
    );
  }
};

const blacklistToken = async (
  token: string,
  userId?: string,
): Promise<{ success: boolean; message: string }> => {
  const decoded = jwt.decode(token) as JwtPayload | null;

  if (!decoded || typeof decoded !== "object" || !decoded.exp) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Invalid or malformed authentication token",
    );
  }

  const expiresAt = new Date(decoded.exp * 1000);
  const tokenHash = hashToken(token);
  const targetUserId = userId || (decoded.id as string) || null;

  try {
    const existing = await prisma.blacklistedToken.findUnique({
      where: { tokenHash },
      select: { id: true },
    });

    if (existing) {
      return { success: true, message: "User logged out successfully" };
    }

    await prisma.blacklistedToken.create({
      data: {
        tokenHash,
        userId: targetUserId,
        expiresAt,
        revokedAt: new Date(),
      },
    });

    return { success: true, message: "User logged out successfully" };
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      return { success: true, message: "User logged out successfully" };
    }
    throw error;
  }
};

const cleanupExpiredTokens = async (): Promise<number> => {
  const now = new Date();
  const result = await prisma.blacklistedToken.deleteMany({
    where: {
      expiresAt: {
        lt: now,
      },
    },
  });
  return result.count;
};

export const TokenBlacklistService = {
  isTokenBlacklisted,
  blacklistToken,
  cleanupExpiredTokens,
};

export default TokenBlacklistService;
