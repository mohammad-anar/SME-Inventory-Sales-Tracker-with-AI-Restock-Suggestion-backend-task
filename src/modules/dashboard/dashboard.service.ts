import { Prisma, PurchaseOrderStatus, SaleStatus } from "@prisma/client";
import prisma from "../../config/prisma.js";
import {
  DashboardSummaryData,
  SalesTrendDataPoint,
  TopProductData,
} from "./dashboard.interface.js";

const getDashboardSummary = async (options?: {
  startDate?: string;
  endDate?: string;
}): Promise<DashboardSummaryData> => {
  const saleWhere: Prisma.SaleWhereInput = {
    status: SaleStatus.COMPLETED,
  };

  if (options?.startDate || options?.endDate) {
    saleWhere.createdAt = {};
    if (options.startDate) {
      saleWhere.createdAt.gte = new Date(options.startDate);
    }
    if (options.endDate) {
      const end = new Date(options.endDate);
      end.setHours(23, 59, 59, 999);
      saleWhere.createdAt.lte = end;
    }
  }

  const [sales, products, purchaseOrders] = await Promise.all([
    prisma.sale.findMany({
      where: saleWhere,
      select: {
        totalAmount: true,
        discount: true,
        items: {
          select: {
            quantity: true,
            unitCost: true,
          },
        },
      },
    }),
    prisma.product.findMany({
      select: {
        stockQty: true,
        reorderLevel: true,
        unitPrice: true,
        costPrice: true,
        isActive: true,
      },
    }),
    prisma.purchaseOrder.findMany({
      select: {
        status: true,
        totalCost: true,
      },
    }),
  ]);

  let grossRevenue = 0;
  let totalDiscount = 0;
  let costOfGoodsSold = 0;

  for (const sale of sales) {
    grossRevenue += Number(sale.totalAmount);
    totalDiscount += Number(sale.discount);
    for (const item of sale.items) {
      costOfGoodsSold += Number(item.unitCost) * item.quantity;
    }
  }

  const totalOrders = sales.length;
  const averageOrderValue = totalOrders > 0 ? Number((grossRevenue / totalOrders).toFixed(2)) : 0;
  const grossProfit = Number((grossRevenue - costOfGoodsSold).toFixed(2));
  const grossProfitMargin =
    grossRevenue > 0 ? Number(((grossProfit / grossRevenue) * 100).toFixed(2)) : 0;

  let activeProducts = 0;
  let inactiveProducts = 0;
  let lowStockProducts = 0;
  let outOfStockProducts = 0;
  let totalUnitsOnHand = 0;
  let inventoryCostValue = 0;
  let inventoryRetailValue = 0;

  for (const prod of products) {
    if (prod.isActive) {
      activeProducts += 1;
    } else {
      inactiveProducts += 1;
    }

    if (prod.stockQty <= 0) {
      outOfStockProducts += 1;
    } else if (prod.stockQty <= prod.reorderLevel) {
      lowStockProducts += 1;
    }

    totalUnitsOnHand += prod.stockQty;
    inventoryCostValue += prod.stockQty * Number(prod.costPrice);
    inventoryRetailValue += prod.stockQty * Number(prod.unitPrice);
  }

  let incurredCost = 0;
  let committedCost = 0;
  let receivedOrdersCount = 0;
  let orderedOrdersCount = 0;
  let draftOrdersCount = 0;

  for (const po of purchaseOrders) {
    if (po.status === PurchaseOrderStatus.RECEIVED) {
      receivedOrdersCount += 1;
      incurredCost += Number(po.totalCost);
    } else if (po.status === PurchaseOrderStatus.ORDERED) {
      orderedOrdersCount += 1;
      committedCost += Number(po.totalCost);
    } else if (po.status === PurchaseOrderStatus.DRAFT) {
      draftOrdersCount += 1;
    }
  }

  return {
    sales: {
      grossRevenue: Number(grossRevenue.toFixed(2)),
      totalOrders,
      averageOrderValue,
      totalDiscount: Number(totalDiscount.toFixed(2)),
      costOfGoodsSold: Number(costOfGoodsSold.toFixed(2)),
      grossProfit,
      grossProfitMargin,
    },
    inventory: {
      totalProducts: products.length,
      activeProducts,
      inactiveProducts,
      lowStockProducts,
      outOfStockProducts,
      inventoryCostValue: Number(inventoryCostValue.toFixed(2)),
      inventoryRetailValue: Number(inventoryRetailValue.toFixed(2)),
      totalUnitsOnHand,
    },
    purchases: {
      incurredCost: Number(incurredCost.toFixed(2)),
      committedCost: Number(committedCost.toFixed(2)),
      receivedOrdersCount,
      orderedOrdersCount,
      draftOrdersCount,
    },
  };
};

const getSalesTrend = async (options?: {
  interval?: "day" | "month";
  startDate?: string;
  endDate?: string;
}): Promise<SalesTrendDataPoint[]> => {
  const where: Prisma.SaleWhereInput = {
    status: SaleStatus.COMPLETED,
  };

  const defaultStartDate = new Date();
  defaultStartDate.setDate(defaultStartDate.getDate() - 30);

  where.createdAt = {
    gte: options?.startDate ? new Date(options.startDate) : defaultStartDate,
  };

  if (options?.endDate) {
    const end = new Date(options.endDate);
    end.setHours(23, 59, 59, 999);
    where.createdAt.lte = end;
  }

  const sales = await prisma.sale.findMany({
    where,
    select: {
      createdAt: true,
      totalAmount: true,
      items: {
        select: {
          quantity: true,
          unitCost: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const trendMap = new Map<
    string,
    { salesCount: number; revenue: number; cogs: number; profit: number }
  >();

  const isMonthly = options?.interval === "month";

  for (const s of sales) {
    const d = new Date(s.createdAt);
    const key = isMonthly
      ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
          d.getDate(),
        ).padStart(2, "0")}`;

    let cogs = 0;
    for (const item of s.items) {
      cogs += Number(item.unitCost) * item.quantity;
    }
    const rev = Number(s.totalAmount);
    const existing = trendMap.get(key) || { salesCount: 0, revenue: 0, cogs: 0, profit: 0 };

    existing.salesCount += 1;
    existing.revenue = Number((existing.revenue + rev).toFixed(2));
    existing.cogs = Number((existing.cogs + cogs).toFixed(2));
    existing.profit = Number((existing.profit + (rev - cogs)).toFixed(2));

    trendMap.set(key, existing);
  }

  const result: SalesTrendDataPoint[] = [];
  for (const [date, val] of trendMap.entries()) {
    result.push({
      date,
      salesCount: val.salesCount,
      revenue: val.revenue,
      cogs: val.cogs,
      profit: val.profit,
    });
  }

  return result;
};

const getTopProducts = async (options?: {
  limit?: number;
  sortBy?: "quantity" | "revenue";
}): Promise<TopProductData[]> => {
  const limit = Math.max(1, Math.min(50, Number(options?.limit) || 5));
  const sortBy = options?.sortBy === "revenue" ? "revenue" : "quantity";

  const saleItems = await prisma.saleItem.findMany({
    where: {
      sale: {
        status: SaleStatus.COMPLETED,
      },
    },
    select: {
      productId: true,
      quantity: true,
      lineTotal: true,
      product: {
        select: {
          name: true,
          sku: true,
          stockQty: true,
        },
      },
    },
  });

  const productMap = new Map<
    string,
    {
      name: string;
      sku: string;
      currentStock: number;
      totalQuantitySold: number;
      totalRevenue: number;
    }
  >();

  for (const item of saleItems) {
    const existing = productMap.get(item.productId) || {
      name: item.product.name,
      sku: item.product.sku,
      currentStock: item.product.stockQty,
      totalQuantitySold: 0,
      totalRevenue: 0,
    };

    existing.totalQuantitySold += item.quantity;
    existing.totalRevenue = Number((existing.totalRevenue + Number(item.lineTotal)).toFixed(2));
    productMap.set(item.productId, existing);
  }

  const array = Array.from(productMap.entries()).map(([productId, data]) => ({
    productId,
    ...data,
  }));

  if (sortBy === "revenue") {
    array.sort((a, b) => b.totalRevenue - a.totalRevenue);
  } else {
    array.sort((a, b) => b.totalQuantitySold - a.totalQuantitySold);
  }

  return array.slice(0, limit);
};

export const DashboardService = {
  getDashboardSummary,
  getSalesTrend,
  getTopProducts,
};

export default DashboardService;
