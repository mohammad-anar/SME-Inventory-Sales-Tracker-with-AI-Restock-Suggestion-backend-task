import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { Secret } from "jsonwebtoken";
import { Role } from "@prisma/client";
import env from "../config/env.js";
import prisma from "../config/prisma.js";
import ApiError from "../utils/ApiError.js";
import { jwtHelper } from "../utils/jwt.js";

export const auth =
  (...roles: Role[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tokenWithBearer = req.headers.authorization;
      if (!tokenWithBearer) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, "You are not authorized");
      }

      if (!tokenWithBearer.startsWith("Bearer ")) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          "Invalid token format! Token must start with Bearer",
        );
      }

      const token = tokenWithBearer.split(" ")[1];

      // verify token
      const verifyUser = jwtHelper.verifyToken(
        token,
        env.jwt.jwt_secret as Secret,
      ) as { id: string; email: string; role: Role };

      // check if user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: verifyUser.id },
        select: { id: true, email: true, role: true, isActive: true },
      });

      if (!user) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, "User does not exist");
      }

      if (!user.isActive) {
        throw new ApiError(
          StatusCodes.FORBIDDEN,
          "User account has been deactivated",
        );
      }

      req.user = user;

      // role guard
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
