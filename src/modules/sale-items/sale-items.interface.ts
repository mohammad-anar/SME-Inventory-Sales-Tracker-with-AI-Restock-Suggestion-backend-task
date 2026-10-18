import { Role } from "@prisma/client";

export type CreateSaleItemStandalonePayload = {
  saleId: string;
  productId: string;
  quantity: number;
};

export type UpdateSaleItemPayload = {
  quantity: number;
};

export type SaleItemQueryOptions = {
  page?: string | number;
  limit?: string | number;
  saleId?: string;
  productId?: string;
  search?: string;
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
