import prisma from "../../config/prisma.js";
import { GeminiService, ICandidateProductInput } from "./gemini.service.js";
import {
  IRestockRecommendation,
  IRestockSummary,
  IProductForecastDetail,
  IDailySalesHistory,
  RestockPriority,
  ForecastConfidence,
} from "./ai-restock.interface.js";

interface IGetRecommendationsParams {
  planningHorizonDays?: number;
  analysisPeriodDays?: number;
  priority?: "HIGH" | "MEDIUM" | "LOW" | "ALL";
  search?: string;
  forceRefresh?: boolean;
}

interface ICachedForecast {
  timestamp: number;
  recommendations: IRestockRecommendation[];
  summary: IRestockSummary;
}

const CACHE_TTL_MS = 10 * 60 * 1000;
const memoryCache = new Map<string, ICachedForecast>();

const calculateDeterministicRestock = (
  product: {
    id: string;
    name: string;
    sku: string;
    category: { name: string };
    supplier: { id: string; name: string; email?: string | null; phone?: string | null };
    currentStock: number;
    reorderLevel: number;
    costPrice: number;
    unitPrice: number;
  },
  salesInPeriod: { quantity: number; createdAt: Date }[],
  incomingStock: number,
  analysisPeriodDays: number,
  planningHorizonDays: number,
): {
  recommendation: IRestockRecommendation;
  candidateInput: ICandidateProductInput;
  dailyHistory: IDailySalesHistory[];
} => {
  const unitsSoldInPeriod = salesInPeriod.reduce((sum, item) => sum + item.quantity, 0);
  const averageDailyDemand = Number((unitsSoldInPeriod / analysisPeriodDays).toFixed(2));

  let estimatedDaysRemaining = 999;
  if (product.currentStock <= 0) {
    estimatedDaysRemaining = 0;
  } else if (averageDailyDemand > 0) {
    estimatedDaysRemaining = Number((product.currentStock / averageDailyDemand).toFixed(1));
  }

  const midPoint = new Date();
  midPoint.setDate(midPoint.getDate() - Math.floor(analysisPeriodDays / 2));

  let recentHalfUnits = 0;
  let olderHalfUnits = 0;
  for (const s of salesInPeriod) {
    if (s.createdAt >= midPoint) {
      recentHalfUnits += s.quantity;
    } else {
      olderHalfUnits += s.quantity;
    }
  }

  let demandTrend: "UP" | "DOWN" | "STABLE" | "INSUFFICIENT_DATA" = "STABLE";
  if (unitsSoldInPeriod < 3) {
    demandTrend = "INSUFFICIENT_DATA";
  } else if (recentHalfUnits > olderHalfUnits * 1.25) {
    demandTrend = "UP";
  } else if (olderHalfUnits > recentHalfUnits * 1.25) {
    demandTrend = "DOWN";
  }

  const targetStock = Math.ceil(averageDailyDemand * planningHorizonDays);
  const projectedAvailableStock = product.currentStock + incomingStock;
  const minRequiredStock = Math.max(product.reorderLevel, targetStock);
  const suggestedRestockQuantity = Math.max(0, Math.ceil(minRequiredStock - projectedAvailableStock));
  const estimatedRestockCost = Number((suggestedRestockQuantity * product.costPrice).toFixed(2));

  let priority: RestockPriority = "LOW";
  if (
    product.currentStock <= 0 ||
    (estimatedDaysRemaining <= 3 && unitsSoldInPeriod > 0) ||
    product.currentStock < Math.ceil(product.reorderLevel * 0.5)
  ) {
    priority = "HIGH";
  } else if (
    product.currentStock <= product.reorderLevel ||
    (estimatedDaysRemaining <= planningHorizonDays && unitsSoldInPeriod > 0)
  ) {
    priority = "MEDIUM";
  }

  let confidence: ForecastConfidence = "LOW";
  if (salesInPeriod.length >= 7 || unitsSoldInPeriod >= 15) {
    confidence = "HIGH";
  } else if (unitsSoldInPeriod > 0) {
    confidence = "MEDIUM";
  }

  const warnings: string[] = [];
  if (product.currentStock <= 0) {
    warnings.push("Out of stock: immediate customer order impact");
  } else if (product.currentStock <= product.reorderLevel) {
    warnings.push(`Stock level (${product.currentStock}) is at or below reorder threshold (${product.reorderLevel})`);
  }
  if (incomingStock > 0) {
    warnings.push(`${incomingStock} units confirmed in incoming purchase orders`);
  }
  if (unitsSoldInPeriod === 0) {
    warnings.push("Zero sales recorded during the analysis period");
  } else if (confidence === "LOW") {
    warnings.push("Low historical data points: restock with conservative buffers");
  }

  let reason = "";
  if (product.currentStock <= 0) {
    reason = `Inventory exhausted (0 available). Immediate restock of ${suggestedRestockQuantity} units recommended to resume sales.`;
  } else if (product.currentStock <= product.reorderLevel) {
    reason = `Current stock (${product.currentStock}) is below reorder level (${product.reorderLevel}) with ~${estimatedDaysRemaining} days remaining.`;
  } else if (suggestedRestockQuantity > 0) {
    reason = `Projected demand will exhaust current stock in ~${estimatedDaysRemaining} days based on daily velocity of ${averageDailyDemand} units/day.`;
  } else {
    reason = `Healthy buffer available (${product.currentStock} units). Projected coverage is ~${estimatedDaysRemaining} days.`;
  }

  const dailyMap = new Map<string, number>();
  for (let i = analysisPeriodDays - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    dailyMap.set(key, 0);
  }

  for (const s of salesInPeriod) {
    const key = s.createdAt.toISOString().split("T")[0];
    if (dailyMap.has(key)) {
      dailyMap.set(key, (dailyMap.get(key) || 0) + s.quantity);
    }
  }

  const dailyHistory: IDailySalesHistory[] = Array.from(dailyMap.entries()).map(
    ([date, quantity]) => ({ date, quantity }),
  );

  const candidateInput: ICandidateProductInput = {
    productId: product.id,
    name: product.name,
    sku: product.sku,
    category: product.category.name,
    currentStock: product.currentStock,
    reorderLevel: product.reorderLevel,
    unitsSoldInPeriod,
    averageDailyDemand,
    demandTrend,
    estimatedDaysRemaining,
    incomingStock,
    suggestedRestockQuantity,
  };

  const recommendation: IRestockRecommendation = {
    productId: product.id,
    name: product.name,
    sku: product.sku,
    categoryName: product.category.name,
    supplierName: product.supplier.name,
    supplierId: product.supplier.id,
    currentStock: product.currentStock,
    reorderLevel: product.reorderLevel,
    costPrice: product.costPrice,
    unitPrice: product.unitPrice,
    unitsSoldInPeriod,
    averageDailyDemand,
    demandTrend,
    estimatedDaysRemaining,
    incomingStock,
    suggestedRestockQuantity,
    estimatedRestockCost,
    priority,
    confidence,
    reason,
    warnings,
    aiGenerated: false,
  };

  return { recommendation, candidateInput, dailyHistory };
};

const getRestockRecommendations = async (params: IGetRecommendationsParams) => {
  const planningHorizonDays = Number(params.planningHorizonDays) || 7;
  const analysisPeriodDays = Number(params.analysisPeriodDays) || 30;
  const cacheKey = `${analysisPeriodDays}_${planningHorizonDays}`;

  const cached = memoryCache.get(cacheKey);
  const now = Date.now();

  let allRecommendations: IRestockRecommendation[] = [];
  let summary: IRestockSummary;

  if (cached && !params.forceRefresh && now - cached.timestamp < CACHE_TTL_MS) {
    allRecommendations = cached.recommendations;
    summary = cached.summary;
  } else {
    const periodStartDate = new Date();
    periodStartDate.setDate(periodStartDate.getDate() - analysisPeriodDays);

    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        category: { select: { name: true } },
        supplier: { select: { id: true, name: true, email: true, phone: true } },
        saleItems: {
          where: {
            sale: {
              status: "COMPLETED",
              createdAt: { gte: periodStartDate },
            },
          },
          select: {
            quantity: true,
            createdAt: true,
          },
        },
        purchaseOrderItems: {
          where: {
            purchaseOrder: {
              status: "ORDERED",
            },
          },
          select: {
            quantity: true,
          },
        },
      },
      orderBy: [{ stockQty: "asc" }, { name: "asc" }],
    });

    const candidateInputs: ICandidateProductInput[] = [];
    const baseRecommendations: IRestockRecommendation[] = [];

    for (const p of products) {
      const incomingStock = p.purchaseOrderItems.reduce(
        (acc: number, item: { quantity: number }) => acc + item.quantity,
        0,
      );
      const { recommendation, candidateInput } = calculateDeterministicRestock(
        {
          id: p.id,
          name: p.name,
          sku: p.sku,
          category: p.category,
          supplier: p.supplier,
          currentStock: p.stockQty,
          reorderLevel: p.reorderLevel,
          costPrice: Number(p.costPrice),
          unitPrice: Number(p.unitPrice),
        },
        p.saleItems,
        incomingStock,
        analysisPeriodDays,
        planningHorizonDays,
      );

      baseRecommendations.push(recommendation);
      if (recommendation.suggestedRestockQuantity > 0 || recommendation.priority === "HIGH" || recommendation.priority === "MEDIUM") {
        candidateInputs.push(candidateInput);
      }
    }

    let aiStatus: "ONLINE" | "DETERMINISTIC_FALLBACK" | "CONFIG_REQUIRED" = "CONFIG_REQUIRED";
    const aiConfigured = GeminiService.isConfigured();

    if (aiConfigured) {
      aiStatus = "DETERMINISTIC_FALLBACK";
      const geminiResults = await GeminiService.generateRecommendations(candidateInputs);

      if (geminiResults) {
        aiStatus = "ONLINE";
        for (const rec of baseRecommendations) {
          const aiRec = geminiResults.get(rec.productId);
          if (aiRec) {
            if (rec.currentStock > 0 && rec.estimatedDaysRemaining > 3) {
              rec.priority = aiRec.priority;
            }
            rec.reason = aiRec.reason;
            if (aiRec.demandTrend) rec.demandTrend = aiRec.demandTrend;
            rec.confidence = aiRec.confidence;
            if (aiRec.warnings && aiRec.warnings.length > 0) {
              const combined = Array.from(new Set([...rec.warnings, ...aiRec.warnings]));
              rec.warnings = combined;
            }
            rec.aiGenerated = true;
          }
        }
      }
    }

    baseRecommendations.sort((a, b) => {
      const priorityWeights: Record<RestockPriority, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      if (priorityWeights[b.priority] !== priorityWeights[a.priority]) {
        return priorityWeights[b.priority] - priorityWeights[a.priority];
      }
      return a.estimatedDaysRemaining - b.estimatedDaysRemaining;
    });

    const highPriorityCount = baseRecommendations.filter((r) => r.priority === "HIGH").length;
    const mediumPriorityCount = baseRecommendations.filter((r) => r.priority === "MEDIUM").length;
    const lowPriorityCount = baseRecommendations.filter((r) => r.priority === "LOW").length;
    const belowReorderCount = baseRecommendations.filter((r) => r.currentStock <= r.reorderLevel).length;
    const criticalRunoutCount = baseRecommendations.filter((r) => r.estimatedDaysRemaining <= 3 && r.suggestedRestockQuantity > 0).length;
    const totalEstimatedRestockCost = Number(
      baseRecommendations
        .reduce((sum, r) => sum + r.estimatedRestockCost, 0)
        .toFixed(2),
    );

    summary = {
      totalAnalyzedProducts: baseRecommendations.length,
      highPriorityCount,
      mediumPriorityCount,
      lowPriorityCount,
      belowReorderCount,
      criticalRunoutCount,
      totalEstimatedRestockCost,
      planningHorizonDays,
      analysisPeriodDays,
      aiStatus,
      aiModel: GeminiService.getModelName(),
      lastGeneratedAt: new Date().toISOString(),
    };

    allRecommendations = baseRecommendations;
    memoryCache.set(cacheKey, {
      timestamp: now,
      recommendations: allRecommendations,
      summary,
    });
  }

  let filtered = [...allRecommendations];
  if (params.priority && params.priority !== "ALL") {
    filtered = filtered.filter((r) => r.priority === params.priority);
  }
  if (params.search && params.search.trim()) {
    const q = params.search.trim().toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.sku.toLowerCase().includes(q) ||
        r.categoryName.toLowerCase().includes(q) ||
        r.supplierName.toLowerCase().includes(q),
    );
  }

  return {
    summary,
    recommendations: filtered,
  };
};

const getProductForecast = async (
  productId: string,
  planningHorizonDays = 7,
  analysisPeriodDays = 30,
): Promise<IProductForecastDetail | null> => {
  const periodStartDate = new Date();
  periodStartDate.setDate(periodStartDate.getDate() - analysisPeriodDays);

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      category: { select: { name: true } },
      supplier: { select: { id: true, name: true, email: true, phone: true } },
      saleItems: {
        where: {
          sale: {
            status: "COMPLETED",
            createdAt: { gte: periodStartDate },
          },
        },
        select: {
          quantity: true,
          createdAt: true,
        },
      },
      purchaseOrderItems: {
        where: {
          purchaseOrder: {
            status: "ORDERED",
          },
        },
        select: {
          quantity: true,
        },
      },
    },
  });

  if (!product) {
    return null;
  }

  const incomingStock = product.purchaseOrderItems.reduce(
    (acc: number, item: { quantity: number }) => acc + item.quantity,
    0,
  );
  const { recommendation, candidateInput, dailyHistory } = calculateDeterministicRestock(
    {
      id: product.id,
      name: product.name,
      sku: product.sku,
      category: product.category,
      supplier: product.supplier,
      currentStock: product.stockQty,
      reorderLevel: product.reorderLevel,
      costPrice: Number(product.costPrice),
      unitPrice: Number(product.unitPrice),
    },
    product.saleItems,
    incomingStock,
    analysisPeriodDays,
    planningHorizonDays,
  );

  let aiStatus: "ONLINE" | "DETERMINISTIC_FALLBACK" | "CONFIG_REQUIRED" = "CONFIG_REQUIRED";
  if (GeminiService.isConfigured()) {
    aiStatus = "DETERMINISTIC_FALLBACK";
    const aiExplanation = await GeminiService.generateProductExplanation(candidateInput);
    if (aiExplanation) {
      aiStatus = "ONLINE";
      if (recommendation.currentStock > 0 && recommendation.estimatedDaysRemaining > 3) {
        recommendation.priority = aiExplanation.priority;
      }
      recommendation.reason = aiExplanation.reason;
      if (aiExplanation.demandTrend) recommendation.demandTrend = aiExplanation.demandTrend;
      recommendation.confidence = aiExplanation.confidence;
      if (aiExplanation.warnings && aiExplanation.warnings.length > 0) {
        recommendation.warnings = Array.from(new Set([...recommendation.warnings, ...aiExplanation.warnings]));
      }
      recommendation.aiGenerated = true;
    }
  }

  return {
    product: {
      id: product.id,
      name: product.name,
      sku: product.sku,
      category: product.category.name,
      supplier: product.supplier,
      currentStock: product.stockQty,
      reorderLevel: product.reorderLevel,
      costPrice: Number(product.costPrice),
      unitPrice: Number(product.unitPrice),
    },
    metrics: {
      analysisPeriodDays,
      planningHorizonDays,
      unitsSoldInPeriod: recommendation.unitsSoldInPeriod,
      averageDailyDemand: recommendation.averageDailyDemand,
      demandTrend: recommendation.demandTrend,
      estimatedDaysRemaining: recommendation.estimatedDaysRemaining,
      incomingStock: recommendation.incomingStock,
      targetStock: Math.ceil(recommendation.averageDailyDemand * planningHorizonDays),
      suggestedRestockQuantity: recommendation.suggestedRestockQuantity,
      estimatedCost: recommendation.estimatedRestockCost,
    },
    salesHistory: dailyHistory,
    recommendation: {
      priority: recommendation.priority,
      confidence: recommendation.confidence,
      reason: recommendation.reason,
      warnings: recommendation.warnings,
      aiGenerated: recommendation.aiGenerated,
    },
    aiStatus,
    aiModel: GeminiService.getModelName(),
  };
};

export const AiRestockService = {
  getRestockRecommendations,
  getProductForecast,
};
