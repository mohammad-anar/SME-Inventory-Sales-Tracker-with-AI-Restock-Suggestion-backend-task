import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { Secret } from "jsonwebtoken";
import { Role } from "@prisma/client";
import env from "../config/env.js";
import prisma from "../config/prisma.js";
import ApiError from "../utils/ApiError.js";
import { jwtHelper } from "../utils/jwt.js";
import { TokenBlacklistService } from "../modules/auth/tokenBlacklist.service.js";

export const auth =
  (...roles: Role[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tokenWithBearer = req.headers.authorization;
      if (!tokenWithBearer) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, "Authentication required");
      }

      if (!tokenWithBearer.startsWith("Bearer ")) {
        throw new ApiError(
          StatusCodes.UNAUTHORIZED,
          "Authentication required",
        );
      }

      const token = tokenWithBearer.split(" ")[1];
      if (!token) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, "Authentication required");
      }

      const isBlacklisted = await TokenBlacklistService.isTokenBlacklisted(token);
      if (isBlacklisted) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, "Authentication required");
      }

      let verifyUser: { id: string; email: string; role: Role };
      try {
        verifyUser = jwtHelper.verifyToken(
          token,
          env.jwt.jwt_secret as Secret,
        ) as { id: string; email: string; role: Role };
      } catch {
        throw new ApiError(StatusCodes.UNAUTHORIZED, "Authentication required");
      }

      const user = await prisma.user.findUnique({
        where: { id: verifyUser.id },
        select: { id: true, email: true, role: true, isActive: true },
      });

      if (!user) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, "Authentication required");
      }

      if (!user.isActive) {
        throw new ApiError(
          StatusCodes.FORBIDDEN,
          "User account has been deactivated",
        );
      }

      req.user = user;

      if (roles.length && !roles.includes(user.role)) {
        throw new ApiError(
          StatusCodes.FORBIDDEN,
          "You don't have permission to access this resource",
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };

export default auth;
