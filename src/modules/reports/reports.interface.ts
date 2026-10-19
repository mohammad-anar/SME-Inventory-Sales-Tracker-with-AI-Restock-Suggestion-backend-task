export interface InventoryValuationReportItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  stockQty: number;
  costPrice: number;
  unitPrice: number;
  totalCostValue: number;
  totalRetailValue: number;
  potentialMargin: number;
}

export interface InventoryValuationSummary {
  totalUnitsOnHand: number;
  inventoryCostValue: number;
  inventoryRetailValue: number;
  unrealizedMargin: number;
  items: InventoryValuationReportItem[];
}

export interface SalesReportSummary {
  totalOrders: number;
  grossRevenue: number;
  totalDiscount: number;
  netRevenue: number;
  paymentMethodBreakdown: Record<string, number>;
  sales: {
    id: string;
    invoiceNo: string;
    customerName: string | null;
    totalAmount: number;
    paymentMethod: string;
    createdAt: Date;
    staffName: string;
  }[];
}

export interface PurchaseReportSummary {
  totalOrders: number;
  totalCost: number;
  statusBreakdown: Record<string, number>;
  purchaseOrders: {
    id: string;
    poNumber: string;
    supplierName: string;
    status: string;
    totalCost: number;
    orderedAt: Date | null;
    receivedAt: Date | null;
  }[];
}
