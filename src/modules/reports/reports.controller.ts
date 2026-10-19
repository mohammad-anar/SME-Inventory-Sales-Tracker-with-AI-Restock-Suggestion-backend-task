import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import ReportService from "./reports.service.js";

const getInventoryValuation = catchAsync(async (req: Request, res: Response) => {
  const options = {
    categoryId: req.query.categoryId as string | undefined,
    supplierId: req.query.supplierId as string | undefined,
  };
  const result = await ReportService.getInventoryValuation(options);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Inventory valuation report retrieved successfully",
    data: result,
  });
});

const getSalesReport = catchAsync(async (req: Request, res: Response) => {
  const options = {
    startDate: req.query.startDate as string | undefined,
    endDate: req.query.endDate as string | undefined,
  };
  const result = await ReportService.getSalesReport(options);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Sales report retrieved successfully",
    data: result,
  });
});

const getPurchaseReport = catchAsync(async (req: Request, res: Response) => {
  const options = {
    startDate: req.query.startDate as string | undefined,
    endDate: req.query.endDate as string | undefined,
  };
  const result = await ReportService.getPurchaseReport(options);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Purchase report retrieved successfully",
    data: result,
  });
});

export const ReportController = {
  getInventoryValuation,
  getSalesReport,
  getPurchaseReport,
};

export default ReportController;
