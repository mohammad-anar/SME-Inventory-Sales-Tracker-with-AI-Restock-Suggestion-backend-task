import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import StockMovementService from "./stock-movements.service.js";

const getStockMovements = catchAsync(async (req: Request, res: Response) => {
  const result = await StockMovementService.getStockMovements(req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Stock movements retrieved successfully",
    pagination: {
      page: result.meta.page,
      limit: result.meta.limit,
      total: result.meta.total,
      totalPage: result.meta.totalPages,
    },
    data: result.data,
  });
});

const getStockMovementById = catchAsync(async (req: Request, res: Response) => {
  const result = await StockMovementService.getStockMovementById(req.params.id as string);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Stock movement retrieved successfully",
    data: result,
  });
});

const adjustStock = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const result = await StockMovementService.adjustStock(req.body, userId);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Stock adjusted successfully",
    data: result,
  });
});

export const StockMovementController = {
  getStockMovements,
  getStockMovementById,
  adjustStock,
};

export default StockMovementController;
