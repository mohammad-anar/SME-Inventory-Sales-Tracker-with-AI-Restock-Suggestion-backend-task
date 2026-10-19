import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import { UserServices } from "./users.service.js";
import { StaffServices } from "../staff/staff.service.js";

const createStaffAccount = catchAsync(async (req: Request, res: Response) => {
  const origin = req.get("origin") || req.get("referer");
  let frontendBaseUrl: string | undefined;
  if (origin) {
    try {
      const url = new URL(origin);
      frontendBaseUrl = `${url.protocol}//${url.host}`;
    } catch {
      frontendBaseUrl = undefined;
    }
  }

  const result = await UserServices.createStaffAccount(req.body, frontendBaseUrl);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Staff account created successfully with setup link",
    data: result,
  });
});

const generateSetupToken = catchAsync(async (req: Request, res: Response) => {
  const origin = req.get("origin") || req.get("referer");
  let frontendBaseUrl: string | undefined;
  if (origin) {
    try {
      const url = new URL(origin);
      frontendBaseUrl = `${url.protocol}//${url.host}`;
    } catch {
      frontendBaseUrl = undefined;
    }
  }

  const result = await UserServices.generateSetupToken(req.params.id, frontendBaseUrl);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "New setup link generated successfully",
    data: result,
  });
});

const createUser = catchAsync(async (req: Request, res: Response) => {
  const result = await UserServices.createUser(req.body);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Staff user created successfully",
    data: result,
  });
});

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await UserServices.getAllUsers(req.query);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Users retrieved successfully",
    pagination: result.pagination,
    data: result.data,
  });
});

const getUserById = catchAsync(async (req: Request, res: Response) => {
  const result = await UserServices.getUserById(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User retrieved successfully",
    data: result,
  });
});

const updateUser = catchAsync(async (req: Request, res: Response) => {
  const result = await UserServices.updateUser(req.params.id, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User updated successfully",
    data: result,
  });
});

const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
  const result = await UserServices.updateUserStatus(
    req.params.id,
    req.body.isActive,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: `User account ${req.body.isActive ? "activated" : "deactivated"} successfully`,
    data: result,
  });
});

const updateUserPassword = catchAsync(async (req: Request, res: Response) => {
  const result = await UserServices.updateUserPassword(req.params.id, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: null,
  });
});

const getProfile = catchAsync(async (req: Request, res: Response) => {
  const result = await UserServices.getUserById(req.user.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Current profile retrieved successfully",
    data: result,
  });
});

const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const result = await UserServices.updateProfile(req.user.id, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Profile updated successfully",
    data: result,
  });
});

const getStaffSales = catchAsync(async (req: Request, res: Response) => {
  const result = await StaffServices.getStaffSales(req.params.id, req.query);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Staff sales retrieved successfully",
    data: (result as any).data,
    pagination: (result as any).pagination,
  });
});

const getStaffActivities = catchAsync(async (req: Request, res: Response) => {
  const result = await StaffServices.getStaffActivities(req.params.id, req.query);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Staff activities retrieved successfully",
    data: result.data,
    pagination: result.meta,
  });
});

export const UserController = {
  createStaffAccount,
  generateSetupToken,
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  updateUserStatus,
  updateUserPassword,
  getProfile,
  updateProfile,
  getStaffSales,
  getStaffActivities,
};

export default UserController;
