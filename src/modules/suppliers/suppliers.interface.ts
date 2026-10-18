export type CreateSupplierPayload = {
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
};

export type UpdateSupplierPayload = {
  name?: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
};

export type UpdateSupplierStatusPayload = {
  isActive: boolean;
};

export type SupplierQueryOptions = {
  page?: string | number;
  limit?: string | number;
  search?: string;
  isActive?: string | boolean;
};
