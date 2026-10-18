import { PaymentMethod, Role, SaleStatus } from "@prisma/client";

export type CreateSaleItemPayload = {
  productId: string;
  quantity: number;
};

export type CreateSalePayload = {
  customerName?: string | null;
  discount?: number | string;
  paymentMethod?: PaymentMethod;
  items: CreateSaleItemPayload[];
};

export type SaleQueryOptions = {
  page?: string | number;
  limit?: string | number;
  search?: string;
  status?: SaleStatus | string;
  paymentMethod?: PaymentMethod | string;
  staffId?: string;
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
