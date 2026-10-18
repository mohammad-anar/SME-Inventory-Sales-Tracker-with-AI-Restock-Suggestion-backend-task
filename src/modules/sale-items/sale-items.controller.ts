import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import { AuthenticatedUser } from "./sale-items.interface.js";
import { SaleItemServices } from "./sale-items.service.js";

const createSaleItem = catchAsync(async (req: Request, res: Response) => {
  const result = await SaleItemServices.createSaleItem(
    req.body,
    req.user as AuthenticatedUser,
  );
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Sale item created successfully",
    data: result,
  });
});

const getAllSaleItems = catchAsync(async (req: Request, res: Response) => {
  const result = await SaleItemServices.getAllSaleItems(
    req.query,
    req.user as AuthenticatedUser,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Sale items retrieved successfully",
    pagination: result.pagination,
    data: result.data,
  });
});

const getSaleItemById = catchAsync(async (req: Request, res: Response) => {
  const result = await SaleItemServices.getSaleItemById(
    req.params.id,
    req.user as AuthenticatedUser,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Sale item retrieved successfully",
    data: result,
  });
});

const updateSaleItem = catchAsync(async (req: Request, res: Response) => {
  const result = await SaleItemServices.updateSaleItem(
    req.params.id,
    req.body,
    req.user as AuthenticatedUser,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Sale item updated successfully",
    data: result,
  });
});

const deleteSaleItem = catchAsync(async (req: Request, res: Response) => {
  const result = await SaleItemServices.deleteSaleItem(
    req.params.id,
    req.user as AuthenticatedUser,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Sale item deleted successfully",
    data: result,
  });
});

export const SaleItemController = {
  createSaleItem,
  getAllSaleItems,
  getSaleItemById,
  updateSaleItem,
  deleteSaleItem,
};

export default SaleItemController;
