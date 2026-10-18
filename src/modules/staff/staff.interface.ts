export type IStaffSalesSummary = {
  todaySalesCount: number;
  todaySalesTotal: number;
  rangeSalesCount: number;
  rangeSalesTotal: number;
  completedSalesCount: number;
  voidedSalesCount: number;
};

export type IStaffActivity = {
  id: string;
  type: "SALE_CREATED" | "SALE_VOIDED" | "STOCK_MOVEMENT" | "PURCHASE_ORDER";
  entityId: string;
  entityType: string;
  description: string;
  timestamp: Date;
  status: string;
};
