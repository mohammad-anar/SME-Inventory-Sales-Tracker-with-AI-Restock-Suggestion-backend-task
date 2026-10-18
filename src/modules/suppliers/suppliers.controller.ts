import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import { SupplierServices } from "./suppliers.service.js";

const createSupplier = catchAsync(async (req: Request, res: Response) => {
  const result = await SupplierServices.createSupplier(req.body);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Supplier created successfully",
    data: result,
  });
});

const getAllSuppliers = catchAsync(async (req: Request, res: Response) => {
  const result = await SupplierServices.getAllSuppliers(req.query);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Suppliers retrieved successfully",
    pagination: result.pagination,
    data: result.data,
  });
});

const getSupplierById = catchAsync(async (req: Request, res: Response) => {
  const result = await SupplierServices.getSupplierById(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Supplier retrieved successfully",
    data: result,
  });
});

const updateSupplier = catchAsync(async (req: Request, res: Response) => {
  const result = await SupplierServices.updateSupplier(req.params.id, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Supplier updated successfully",
    data: result,
  });
});

const updateSupplierStatus = catchAsync(async (req: Request, res: Response) => {
  const result = await SupplierServices.updateSupplierStatus(
    req.params.id,
    req.body,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Supplier status updated successfully",
    data: result,
  });
});

export const SupplierController = {
  createSupplier,
  getAllSuppliers,
  getSupplierById,
  updateSupplier,
  updateSupplierStatus,
};

export default SupplierController;
