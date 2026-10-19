import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import jwt, { JwtPayload } from "jsonwebtoken";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import ApiError from "../../utils/ApiError.js";
import { AuthService } from "./auth.service.js";

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.loginUser(req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User logged in successfully",
    data: result,
  });
});

const getMe = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const result = await AuthService.getMe(userId);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User profile retrieved successfully",
    data: result,
  });
});

const logoutUser = catchAsync(async (req: Request, res: Response) => {
  const tokenWithBearer = req.headers.authorization;
  if (!tokenWithBearer || !tokenWithBearer.startsWith("Bearer ")) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Authentication required");
  }

  const token = tokenWithBearer.split(" ")[1];
  if (!token) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Authentication required");
  }

  const decoded = jwt.decode(token) as JwtPayload | null;
  if (!decoded || typeof decoded !== "object" || !decoded.exp) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Authentication required");
  }

  const result = await AuthService.logoutUser(
    token,
    decoded.id as string | undefined,
  );

  if (req.cookies?.token || req.cookies?.accessToken) {
    res.clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });
  }

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message || "User logged out successfully",
    data: null,
  });
});

const registerUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.registerUser(req.body);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Staff user registered successfully",
    data: result,
  });
});

const verifySetupToken = catchAsync(async (req: Request, res: Response) => {
  const token = (req.query.token as string) || req.body?.token;
  const result = await AuthService.verifySetupToken(token);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Setup token verified successfully",
    data: result,
  });
});

const setPassword = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.setPassword(req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Password set successfully and logged in",
    data: result,
  });
});

export const AuthController = {
  loginUser,
  registerUser,
  getMe,
  logoutUser,
  verifySetupToken,
  setPassword,
};

export default AuthController;
