import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import ApiError from "../../utils/ApiError.js";
import { AiRestockService } from "./ai-restock.service.js";

const getRestockRecommendations = catchAsync(async (req: Request, res: Response) => {
  const result = await AiRestockService.getRestockRecommendations(req.query as any);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "AI restock recommendations retrieved successfully",
    data: result,
  });
});

const getProductForecast = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const planningHorizon = req.query.planningHorizonDays
    ? parseInt(req.query.planningHorizonDays as string, 10)
    : 7;
  const analysisPeriod = req.query.analysisPeriodDays
    ? parseInt(req.query.analysisPeriodDays as string, 10)
    : 30;

  const result = await AiRestockService.getProductForecast(id, planningHorizon, analysisPeriod);

  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Product not found or currently inactive");
  }

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Product restock forecast retrieved successfully",
    data: result,
  });
});

const refreshRestockRecommendations = catchAsync(async (req: Request, res: Response) => {
  const result = await AiRestockService.getRestockRecommendations({
    ...(req.query as any),
    forceRefresh: true,
  });

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "AI restock recommendations refreshed successfully",
    data: result,
  });
});

export const AiRestockController = {
  getRestockRecommendations,
  getProductForecast,
  refreshRestockRecommendations,
};
