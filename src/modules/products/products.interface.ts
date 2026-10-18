export type CreateProductPayload = {
  sku: string;
  name: string;
  description?: string | null;
  barcode?: string | null;
  categoryId: string;
  supplierId: string;
  avatar?: string | null;
  unitPrice: number | string;
  costPrice: number | string;
  reorderLevel?: number;
};

export type UpdateProductPayload = {
  sku?: string;
  name?: string;
  description?: string | null;
  barcode?: string | null;
  categoryId?: string;
  supplierId?: string;
  avatar?: string | null;
  unitPrice?: number | string;
  costPrice?: number | string;
  reorderLevel?: number;
};

export type UpdateProductStatusPayload = {
  isActive: boolean;
};

export type ProductQueryOptions = {
  page?: string | number;
  limit?: string | number;
  search?: string;
  categoryId?: string;
  supplierId?: string;
  isActive?: string | boolean;
  stockStatus?: string;
  sortBy?: string;
  sortOrder?: string;
};

export type LowStockQueryOptions = {
  page?: string | number;
  limit?: string | number;
  categoryId?: string;
  supplierId?: string;
  isActive?: string | boolean;
  stockStatus?: string;
};
