import { Prisma, SaleStatus } from "@prisma/client";
import prisma from "../../config/prisma.js";
import {
  InventoryValuationSummary,
  PurchaseReportSummary,
  SalesReportSummary,
} from "./reports.interface.js";

const getInventoryValuation = async (options?: {
  categoryId?: string;
  supplierId?: string;
}): Promise<InventoryValuationSummary> => {
  const where: Prisma.ProductWhereInput = {
    isActive: true,
  };

  if (options?.categoryId && options.categoryId.trim()) {
    where.categoryId = options.categoryId.trim();
  }

  if (options?.supplierId && options.supplierId.trim()) {
    where.supplierId = options.supplierId.trim();
  }

  const products = await prisma.product.findMany({
    where,
    select: {
      id: true,
      sku: true,
      name: true,
      stockQty: true,
      costPrice: true,
      unitPrice: true,
      category: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  let totalUnitsOnHand = 0;
  let inventoryCostValue = 0;
  let inventoryRetailValue = 0;

  const items = products.map((p) => {
    const cost = Number(p.costPrice);
    const price = Number(p.unitPrice);
    const totalCost = Number((p.stockQty * cost).toFixed(2));
    const totalRetail = Number((p.stockQty * price).toFixed(2));
    const margin = totalRetail > 0 ? Number((((totalRetail - totalCost) / totalRetail) * 100).toFixed(2)) : 0;

    totalUnitsOnHand += p.stockQty;
    inventoryCostValue += totalCost;
    inventoryRetailValue += totalRetail;

    return {
      id: p.id,
      sku: p.sku,
      name: p.name,
      category: p.category.name,
      stockQty: p.stockQty,
      costPrice: cost,
      unitPrice: price,
      totalCostValue: totalCost,
      totalRetailValue: totalRetail,
      potentialMargin: margin,
    };
  });

  inventoryCostValue = Number(inventoryCostValue.toFixed(2));
  inventoryRetailValue = Number(inventoryRetailValue.toFixed(2));
  const unrealizedMargin =
    inventoryRetailValue > 0
      ? Number((((inventoryRetailValue - inventoryCostValue) / inventoryRetailValue) * 100).toFixed(2))
      : 0;

  return {
    totalUnitsOnHand,
    inventoryCostValue,
    inventoryRetailValue,
    unrealizedMargin,
    items,
  };
};

const getSalesReport = async (options?: {
  startDate?: string;
  endDate?: string;
}): Promise<SalesReportSummary> => {
  const where: Prisma.SaleWhereInput = {
    status: SaleStatus.COMPLETED,
  };

  if (options?.startDate || options?.endDate) {
    where.createdAt = {};
    if (options.startDate) {
      where.createdAt.gte = new Date(options.startDate);
    }
    if (options.endDate) {
      const end = new Date(options.endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

  const sales = await prisma.sale.findMany({
    where,
    select: {
      id: true,
      invoiceNo: true,
      customerName: true,
      totalAmount: true,
      discount: true,
      paymentMethod: true,
      createdAt: true,
      staff: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  let grossRevenue = 0;
  let totalDiscount = 0;
  const paymentBreakdown: Record<string, number> = {};

  const mappedSales = sales.map((s) => {
    const amount = Number(s.totalAmount);
    grossRevenue += amount;
    totalDiscount += Number(s.discount);

    paymentBreakdown[s.paymentMethod] = (paymentBreakdown[s.paymentMethod] || 0) + amount;

    return {
      id: s.id,
      invoiceNo: s.invoiceNo,
      customerName: s.customerName,
      totalAmount: amount,
      paymentMethod: s.paymentMethod,
      createdAt: s.createdAt,
      staffName: s.staff.name,
    };
  });

  grossRevenue = Number(grossRevenue.toFixed(2));
  totalDiscount = Number(totalDiscount.toFixed(2));
  const netRevenue = Number((grossRevenue - totalDiscount).toFixed(2));

  return {
    totalOrders: sales.length,
    grossRevenue,
    totalDiscount,
    netRevenue,
    paymentMethodBreakdown: paymentBreakdown,
    sales: mappedSales,
  };
};

const getPurchaseReport = async (options?: {
  startDate?: string;
  endDate?: string;
}): Promise<PurchaseReportSummary> => {
  const where: Prisma.PurchaseOrderWhereInput = {};

  if (options?.startDate || options?.endDate) {
    where.createdAt = {};
    if (options.startDate) {
      where.createdAt.gte = new Date(options.startDate);
    }
    if (options.endDate) {
      const end = new Date(options.endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

  const purchaseOrders = await prisma.purchaseOrder.findMany({
    where,
    select: {
      id: true,
      poNumber: true,
      status: true,
      totalCost: true,
      orderedAt: true,
      receivedAt: true,
      supplier: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  let totalCost = 0;
  const statusBreakdown: Record<string, number> = {};

  const mappedOrders = purchaseOrders.map((po) => {
    const cost = Number(po.totalCost);
    totalCost += cost;
    statusBreakdown[po.status] = (statusBreakdown[po.status] || 0) + 1;

    return {
      id: po.id,
      poNumber: po.poNumber,
      supplierName: po.supplier.name,
      status: po.status,
      totalCost: cost,
      orderedAt: po.orderedAt,
      receivedAt: po.receivedAt,
    };
  });

  return {
    totalOrders: purchaseOrders.length,
    totalCost: Number(totalCost.toFixed(2)),
    statusBreakdown,
    purchaseOrders: mappedOrders,
  };
};

export const ReportService = {
  getInventoryValuation,
  getSalesReport,
  getPurchaseReport,
};

export default ReportService;
