export type RestockPriority = "HIGH" | "MEDIUM" | "LOW";
export type ForecastConfidence = "HIGH" | "MEDIUM" | "LOW";

export interface IRestockRecommendation {
  productId: string;
  name: string;
  sku: string;
  categoryName: string;
  supplierName: string;
  supplierId: string;
  currentStock: number;
  reorderLevel: number;
  costPrice: number;
  unitPrice: number;
  unitsSoldInPeriod: number;
  averageDailyDemand: number;
  demandTrend: "UP" | "DOWN" | "STABLE" | "INSUFFICIENT_DATA";
  estimatedDaysRemaining: number;
  incomingStock: number;
  suggestedRestockQuantity: number;
  estimatedRestockCost: number;
  priority: RestockPriority;
  confidence: ForecastConfidence;
  reason: string;
  warnings: string[];
  aiGenerated: boolean;
}

export interface IRestockSummary {
  totalAnalyzedProducts: number;
  highPriorityCount: number;
  mediumPriorityCount: number;
  lowPriorityCount: number;
  belowReorderCount: number;
  criticalRunoutCount: number;
  totalEstimatedRestockCost: number;
  planningHorizonDays: number;
  analysisPeriodDays: number;
  aiStatus: "ONLINE" | "DETERMINISTIC_FALLBACK" | "CONFIG_REQUIRED";
  aiModel: string;
  lastGeneratedAt: string;
}

export interface IDailySalesHistory {
  date: string;
  quantity: number;
}

export interface IProductForecastDetail {
  product: {
    id: string;
    name: string;
    sku: string;
    category: string;
    supplier: {
      id: string;
      name: string;
      email?: string | null;
      phone?: string | null;
    };
    currentStock: number;
    reorderLevel: number;
    costPrice: number;
    unitPrice: number;
  };
  metrics: {
    analysisPeriodDays: number;
    planningHorizonDays: number;
    unitsSoldInPeriod: number;
    averageDailyDemand: number;
    demandTrend: "UP" | "DOWN" | "STABLE" | "INSUFFICIENT_DATA";
    estimatedDaysRemaining: number;
    incomingStock: number;
    targetStock: number;
    suggestedRestockQuantity: number;
    estimatedCost: number;
  };
  salesHistory: IDailySalesHistory[];
  recommendation: {
    priority: RestockPriority;
    confidence: ForecastConfidence;
    reason: string;
    warnings: string[];
    aiGenerated: boolean;
  };
  aiStatus: "ONLINE" | "DETERMINISTIC_FALLBACK" | "CONFIG_REQUIRED";
  aiModel: string;
}

export interface IGeminiRecommendationItem {
  productId: string;
  priority: RestockPriority;
  reason: string;
  demandTrend?: "UP" | "DOWN" | "STABLE" | "INSUFFICIENT_DATA";
  confidence: ForecastConfidence;
  warnings?: string[];
}
