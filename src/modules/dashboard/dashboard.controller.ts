import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import DashboardService from "./dashboard.service.js";

const getDashboardSummary = catchAsync(async (req: Request, res: Response) => {
  const result = await DashboardService.getDashboardSummary(req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Dashboard summary retrieved successfully",
    data: result,
  });
});

const getSalesTrend = catchAsync(async (req: Request, res: Response) => {
  const options = {
    interval: req.query.interval as "day" | "month" | undefined,
    startDate: req.query.startDate as string | undefined,
    endDate: req.query.endDate as string | undefined,
  };
  const result = await DashboardService.getSalesTrend(options);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Sales trend retrieved successfully",
    data: result,
  });
});

const getTopProducts = catchAsync(async (req: Request, res: Response) => {
  const options = {
    limit: req.query.limit ? Number(req.query.limit) : undefined,
    sortBy: req.query.sortBy as "quantity" | "revenue" | undefined,
  };
  const result = await DashboardService.getTopProducts(options);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Top products retrieved successfully",
    data: result,
  });
});

export const DashboardController = {
  getDashboardSummary,
  getSalesTrend,
  getTopProducts,
};

export default DashboardController;
