import { StatusCodes } from "http-status-codes";
import { Prisma, Role, SaleStatus } from "@prisma/client";
import prisma from "../../config/prisma.js";
import ApiError from "../../utils/ApiError.js";
import { userSafeSelect } from "../auth/auth.service.js";
import { SaleServices } from "../sales/sales.service.js";
import { IStaffActivity, IStaffSalesSummary } from "./staff.interface.js";

const getStaffProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userSafeSelect,
  });

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Staff member not found");
  }

  if (!user.isActive) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "Your account has been deactivated",
    );
  }

  return user;
};

const updateStaffProfile = async (
  userId: string,
  payload: { name?: string; phone?: string | null; avatar?: string | null },
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Staff member not found");
  }

  if (!user.isActive) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "Your account has been deactivated",
    );
  }

  const updateData: {
    name?: string;
    phone?: string | null;
    avatar?: string | null;
  } = {};

  if (payload.name && payload.name.trim().length > 0) {
    updateData.name = payload.name.trim();
  }

  if (payload.phone !== undefined) {
    updateData.phone = payload.phone?.trim() ? payload.phone.trim() : null;
  }

  if (payload.avatar !== undefined) {
    updateData.avatar = payload.avatar ? payload.avatar : null;
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: userSafeSelect,
  });

  return updatedUser;
};

const getStaffSales = async (
  userId: string,
  query: Record<string, unknown>,
) => {
  return await SaleServices.getAllSales(query, {
    id: userId,
    email: "",
    role: Role.STAFF,
  });
};

const getStaffSalesSummary = async (
  userId: string,
  query: Record<string, unknown>,
): Promise<IStaffSalesSummary> => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const todayCompletedSales = await prisma.sale.findMany({
    where: {
      staffId: userId,
      status: SaleStatus.COMPLETED,
      createdAt: {
        gte: todayStart,
        lte: todayEnd,
      },
    },
    select: {
      totalAmount: true,
    },
  });

  const todaySalesCount = todayCompletedSales.length;
  const todaySalesTotal = todayCompletedSales.reduce(
    (acc, s) => acc + Number(s.totalAmount),
    0,
  );

  const startParam = query.startDate || query.fromDate;
  const endParam = query.endDate || query.toDate;

  let rangeSalesCount = todaySalesCount;
  let rangeSalesTotal = todaySalesTotal;

  if (startParam || endParam) {
    const dateFilter: Prisma.DateTimeFilter = {};

    if (startParam) {
      const s = new Date(String(startParam));
      if (!isNaN(s.getTime())) {
        dateFilter.gte = s;
      }
    }

    if (endParam) {
      const e = new Date(String(endParam));
      if (!isNaN(e.getTime())) {
        dateFilter.lte = e;
      }
    }

    const rangeWhere: Prisma.SaleWhereInput = {
      staffId: userId,
      status: SaleStatus.COMPLETED,
      createdAt: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
    };

    const rangeSales = await prisma.sale.findMany({
      where: rangeWhere,
      select: {
        totalAmount: true,
      },
    });

    rangeSalesCount = rangeSales.length;
    rangeSalesTotal = rangeSales.reduce(
      (acc, s) => acc + Number(s.totalAmount),
      0,
    );
  }

  const [completedSalesCount, voidedSalesCount] = await Promise.all([
    prisma.sale.count({
      where: {
        staffId: userId,
        status: SaleStatus.COMPLETED,
      },
    }),
    prisma.sale.count({
      where: {
        staffId: userId,
        status: SaleStatus.VOIDED,
      },
    }),
  ]);

  return {
    todaySalesCount,
    todaySalesTotal: Number(todaySalesTotal.toFixed(2)),
    rangeSalesCount,
    rangeSalesTotal: Number(rangeSalesTotal.toFixed(2)),
    completedSalesCount,
    voidedSalesCount,
  };
};

const getStaffActivities = async (
  userId: string,
  query: Record<string, unknown>,
) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(Math.max(1, Number(query.limit) || 10), 50);

  const [sales, stockMovements, purchaseOrders] = await Promise.all([
    prisma.sale.findMany({
      where: { staffId: userId },
      select: {
        id: true,
        invoiceNo: true,
        status: true,
        totalAmount: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.stockMovement.findMany({
      where: { createdById: userId },
      select: {
        id: true,
        type: true,
        quantityChange: true,
        createdAt: true,
        note: true,
        product: {
          select: {
            name: true,
            sku: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.purchaseOrder.findMany({
      where: { createdById: userId },
      select: {
        id: true,
        poNumber: true,
        status: true,
        totalCost: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const activities: IStaffActivity[] = [];

  for (const sale of sales) {
    activities.push({
      id: `act_sale_${sale.id}`,
      type: sale.status === SaleStatus.VOIDED ? "SALE_VOIDED" : "SALE_CREATED",
      entityId: sale.id,
      entityType: "Sale",
      description: `Sale ${sale.invoiceNo} (${sale.status}) - $${Number(sale.totalAmount).toFixed(2)}`,
      timestamp: sale.createdAt,
      status: sale.status,
    });
  }

  for (const sm of stockMovements) {
    activities.push({
      id: `act_sm_${sm.id}`,
      type: "STOCK_MOVEMENT",
      entityId: sm.id,
      entityType: "StockMovement",
      description: `Stock ${sm.type}: ${sm.quantityChange > 0 ? "+" : ""}${sm.quantityChange} units of ${sm.product.name} (${sm.product.sku})`,
      timestamp: sm.createdAt,
      status: sm.type,
    });
  }

  for (const po of purchaseOrders) {
    activities.push({
      id: `act_po_${po.id}`,
      type: "PURCHASE_ORDER",
      entityId: po.id,
      entityType: "PurchaseOrder",
      description: `Purchase order ${po.poNumber} (${po.status}) - $${Number(po.totalCost).toFixed(2)}`,
      timestamp: po.createdAt,
      status: po.status,
    });
  }

  const startParam = query.startDate || query.fromDate;
  const endParam = query.endDate || query.toDate;

  let filteredActivities = activities;

  if (startParam) {
    const s = new Date(String(startParam));
    if (!isNaN(s.getTime())) {
      filteredActivities = filteredActivities.filter(
        (a) => a.timestamp.getTime() >= s.getTime(),
      );
    }
  }

  if (endParam) {
    const e = new Date(String(endParam));
    if (!isNaN(e.getTime())) {
      filteredActivities = filteredActivities.filter(
        (a) => a.timestamp.getTime() <= e.getTime(),
      );
    }
  }

  filteredActivities.sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
  );

  const total = filteredActivities.length;
  const totalPage = Math.ceil(total / limit) || 1;
  const paginatedData = filteredActivities.slice(
    (page - 1) * limit,
    page * limit,
  );

  return {
    meta: {
      page,
      limit,
      total,
      totalPage,
    },
    data: paginatedData,
  };
};

export const StaffServices = {
  getStaffProfile,
  updateStaffProfile,
  getStaffSales,
  getStaffSalesSummary,
  getStaffActivities,
};

export default StaffServices;
