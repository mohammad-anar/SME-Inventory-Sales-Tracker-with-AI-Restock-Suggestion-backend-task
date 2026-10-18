import { PurchaseOrderStatus, Role } from "@prisma/client";

export type CreatePurchaseOrderItemPayload = {
  productId: string;
  quantity: number;
  unitCost: number | string;
};

export type CreatePurchaseOrderPayload = {
  supplierId: string;
  note?: string | null;
  items: CreatePurchaseOrderItemPayload[];
};

export type UpdatePurchaseOrderPayload = {
  supplierId?: string;
  note?: string | null;
  items?: CreatePurchaseOrderItemPayload[];
};

export type UpdatePurchaseOrderStatusPayload = {
  status: PurchaseOrderStatus;
};

export type PurchaseOrderQueryOptions = {
  page?: string | number;
  limit?: string | number;
  search?: string;
  status?: PurchaseOrderStatus | string;
  supplierId?: string;
  startDate?: string;
  endDate?: string;
  fromDate?: string;
  toDate?: string;
  sortBy?: string;
  sortOrder?: string;
};

export type AuthenticatedUser = {
  id: string;
  email: string;
  role: Role;
};
