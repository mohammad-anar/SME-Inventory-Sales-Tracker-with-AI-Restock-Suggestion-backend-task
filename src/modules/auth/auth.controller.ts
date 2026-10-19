import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
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
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User logged out successfully",
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
