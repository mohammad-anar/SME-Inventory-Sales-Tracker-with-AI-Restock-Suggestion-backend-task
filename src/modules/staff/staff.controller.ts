import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import { StaffServices } from "./staff.service.js";

const getStaffProfile = catchAsync(async (req: Request, res: Response) => {
  const result = await StaffServices.getStaffProfile(req.user.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Staff profile retrieved successfully",
    data: result,
  });
});

const updateStaffProfile = catchAsync(async (req: Request, res: Response) => {
  const result = await StaffServices.updateStaffProfile(
    req.user.id,
    req.body,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Staff profile updated successfully",
    data: result,
  });
});

const getStaffSales = catchAsync(async (req: Request, res: Response) => {
  const result = await StaffServices.getStaffSales(req.user.id, req.query);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Staff sales retrieved successfully",
    pagination: result.pagination,
    data: result.data,
  });
});

const getStaffSalesSummary = catchAsync(
  async (req: Request, res: Response) => {
    const result = await StaffServices.getStaffSalesSummary(
      req.user.id,
      req.query,
    );
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Staff sales summary retrieved successfully",
      data: result,
    });
  },
);

const getStaffActivities = catchAsync(async (req: Request, res: Response) => {
  const result = await StaffServices.getStaffActivities(
    req.user.id,
    req.query,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Staff activity history retrieved successfully",
    pagination: result.meta,
    data: result.data,
  });
});

export const StaffController = {
  getStaffProfile,
  updateStaffProfile,
  getStaffSales,
  getStaffSalesSummary,
  getStaffActivities,
};

export default StaffController;
