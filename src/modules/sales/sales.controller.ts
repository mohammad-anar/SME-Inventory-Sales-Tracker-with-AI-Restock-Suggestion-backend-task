import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import { AuthenticatedUser } from "./sales.interface.js";
import { SaleServices } from "./sales.service.js";

const createSale = catchAsync(async (req: Request, res: Response) => {
  const result = await SaleServices.createSale(
    req.body,
    req.user as AuthenticatedUser,
  );
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Sale created successfully",
    data: result,
  });
});

const getAllSales = catchAsync(async (req: Request, res: Response) => {
  const result = await SaleServices.getAllSales(
    req.query,
    req.user as AuthenticatedUser,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Sales retrieved successfully",
    pagination: result.pagination,
    data: result.data,
  });
});

const getSaleById = catchAsync(async (req: Request, res: Response) => {
  const result = await SaleServices.getSaleById(
    req.params.id,
    req.user as AuthenticatedUser,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Sale retrieved successfully",
    data: result,
  });
});

const getSaleByInvoiceNo = catchAsync(async (req: Request, res: Response) => {
  const result = await SaleServices.getSaleByInvoiceNo(
    req.params.invoiceNo,
    req.user as AuthenticatedUser,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Invoice retrieved successfully",
    data: result,
  });
});

const voidSale = catchAsync(async (req: Request, res: Response) => {
  const result = await SaleServices.voidSale(
    req.params.id,
    req.user as AuthenticatedUser,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Sale voided successfully",
    data: result,
  });
});

export const SaleController = {
  createSale,
  getAllSales,
  getSaleById,
  getSaleByInvoiceNo,
  voidSale,
};

export default SaleController;
