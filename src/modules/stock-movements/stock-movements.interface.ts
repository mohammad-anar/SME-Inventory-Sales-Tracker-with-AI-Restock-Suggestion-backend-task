import { StockMovementType } from "@prisma/client";

export interface StockMovementQueryParams {
  page?: string | number;
  limit?: string | number;
  productId?: string;
  type?: StockMovementType | string;
  startDate?: string;
  endDate?: string;
}

export interface ManualStockAdjustmentPayload {
  productId: string;
  quantityChange: number;
  note?: string;
}
