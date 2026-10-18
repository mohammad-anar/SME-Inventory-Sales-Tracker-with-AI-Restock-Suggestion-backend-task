import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import { AuthenticatedUser } from "./purchase-orders.interface.js";
import { PurchaseOrderServices } from "./purchase-orders.service.js";

const createPurchaseOrder = catchAsync(async (req: Request, res: Response) => {
  const result = await PurchaseOrderServices.createPurchaseOrder(
    req.body,
    req.user as AuthenticatedUser,
  );
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Purchase order created successfully",
    data: result,
  });
});

const getAllPurchaseOrders = catchAsync(async (req: Request, res: Response) => {
  const result = await PurchaseOrderServices.getAllPurchaseOrders(req.query);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Purchase orders retrieved successfully",
    pagination: result.pagination,
    data: result.data,
  });
});

const getPurchaseOrderById = catchAsync(async (req: Request, res: Response) => {
  const result = await PurchaseOrderServices.getPurchaseOrderById(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Purchase order retrieved successfully",
    data: result,
  });
});

const updatePurchaseOrder = catchAsync(async (req: Request, res: Response) => {
  const result = await PurchaseOrderServices.updatePurchaseOrder(
    req.params.id,
    req.body,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Purchase order updated successfully",
    data: result,
  });
});

const updatePurchaseOrderStatus = catchAsync(async (req: Request, res: Response) => {
  const result = await PurchaseOrderServices.updatePurchaseOrderStatus(
    req.params.id,
    req.body,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Purchase order status updated successfully",
    data: result,
  });
});

const receivePurchaseOrder = catchAsync(async (req: Request, res: Response) => {
  const result = await PurchaseOrderServices.receivePurchaseOrder(
    req.params.id,
    req.user as AuthenticatedUser,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Purchase order received and stock updated successfully",
    data: result,
  });
});

const getPurchaseOrderReceipt = catchAsync(async (req: Request, res: Response) => {
  const result = await PurchaseOrderServices.getPurchaseOrderReceipt(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Purchase order receipt retrieved successfully",
    data: result,
  });
});

export const PurchaseOrderController = {
  createPurchaseOrder,
  getAllPurchaseOrders,
  getPurchaseOrderById,
  updatePurchaseOrder,
  updatePurchaseOrderStatus,
  receivePurchaseOrder,
  getPurchaseOrderReceipt,
};

export default PurchaseOrderController;
