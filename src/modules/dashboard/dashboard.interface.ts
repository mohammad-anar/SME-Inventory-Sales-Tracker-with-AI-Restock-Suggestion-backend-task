export interface DashboardSummaryData {
  sales: {
    grossRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    totalDiscount: number;
    costOfGoodsSold: number;
    grossProfit: number;
    grossProfitMargin: number;
  };
  inventory: {
    totalProducts: number;
    activeProducts: number;
    inactiveProducts: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    inventoryCostValue: number;
    inventoryRetailValue: number;
    totalUnitsOnHand: number;
  };
  purchases: {
    incurredCost: number;
    committedCost: number;
    receivedOrdersCount: number;
    orderedOrdersCount: number;
    draftOrdersCount: number;
  };
}

export interface SalesTrendDataPoint {
  date: string;
  salesCount: number;
  revenue: number;
  cogs: number;
  profit: number;
}

export interface TopProductData {
  productId: string;
  name: string;
  sku: string;
  currentStock: number;
  totalQuantitySold: number;
  totalRevenue: number;
}
