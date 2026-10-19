import { GoogleGenAI } from "@google/genai";
import env from "../../config/env.js";
import { AiRestockValidation } from "./ai-restock.validation.js";
import { IGeminiRecommendationItem } from "./ai-restock.interface.js";

export interface ICandidateProductInput {
  productId: string;
  name: string;
  sku: string;
  category: string;
  currentStock: number;
  reorderLevel: number;
  unitsSoldInPeriod: number;
  averageDailyDemand: number;
  demandTrend: "UP" | "DOWN" | "STABLE" | "INSUFFICIENT_DATA";
  estimatedDaysRemaining: number;
  incomingStock: number;
  suggestedRestockQuantity: number;
}

const isConfigured = (): boolean => {
  return Boolean(env.gemini.api_key && env.gemini.api_key.trim().length > 0);
};

const getModelName = (): string => {
  return env.gemini.model || "gemini-2.5-flash";
};

const generateRecommendations = async (
  candidates: ICandidateProductInput[],
): Promise<Map<string, IGeminiRecommendationItem> | null> => {
  if (!isConfigured() || candidates.length === 0) {
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: env.gemini.api_key });
    const allowedIds = new Set(candidates.map((c) => c.productId));

    const prompt = `You are StockPilot AI Inventory Decision Analyst.
Analyze the inventory and sales velocity data for the following ${candidates.length} retail products.
Provide a concise, professional explanation for restocking each item, assess runout urgency, and assign a priority level (HIGH, MEDIUM, or LOW).

Guidelines:
- HIGH priority: Out of stock, stock below reorder level, or estimated days remaining <= 3.
- MEDIUM priority: Stock will run out within planning horizon or demand is trending upwards.
- LOW priority: Sufficient buffer stock exists or no immediate replenishment urgency.
- Output MUST be valid JSON matching this schema:
{
  "recommendations": [
    {
      "productId": "exact product id matching candidate",
      "priority": "HIGH" | "MEDIUM" | "LOW",
      "reason": "1-2 sentence business rationale for restock priority",
      "demandTrend": "UP" | "DOWN" | "STABLE" | "INSUFFICIENT_DATA",
      "confidence": "HIGH" | "MEDIUM" | "LOW",
      "warnings": ["array of risk notes or warnings if applicable"]
    }
  ]
}

Candidate inventory data:
${JSON.stringify(candidates.slice(0, 30), null, 2)}
`;

    const generatePromise = ai.models.generateContent({
      model: getModelName(),
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Gemini API timeout after 7s")), 7000),
    );

    const response = await Promise.race([generatePromise, timeoutPromise]);

    const rawText = response.text;
    if (!rawText) {
      return null;
    }

    const parsedJson = JSON.parse(rawText);
    const validated = AiRestockValidation.geminiOutputZodSchema.safeParse(parsedJson);

    if (!validated.success) {
      return null;
    }

    const resultMap = new Map<string, IGeminiRecommendationItem>();
    for (const item of validated.data.recommendations) {
      if (allowedIds.has(item.productId)) {
        resultMap.set(item.productId, {
          productId: item.productId,
          priority: item.priority,
          reason: item.reason,
          demandTrend: item.demandTrend,
          confidence: item.confidence,
          warnings: item.warnings || [],
        });
      }
    }

    return resultMap;
  } catch {
    return null;
  }
};

const generateProductExplanation = async (
  candidate: ICandidateProductInput,
): Promise<IGeminiRecommendationItem | null> => {
  if (!isConfigured()) {
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: env.gemini.api_key });

    const prompt = `You are StockPilot AI Inventory Analyst.
Analyze this single product:
Name: ${candidate.name} (SKU: ${candidate.sku}, Category: ${candidate.category})
Current Stock: ${candidate.currentStock}
Reorder Level: ${candidate.reorderLevel}
Units Sold in Period: ${candidate.unitsSoldInPeriod}
Average Daily Demand: ${candidate.averageDailyDemand}
Estimated Days Remaining: ${candidate.estimatedDaysRemaining}
Incoming Stock: ${candidate.incomingStock}
Suggested Restock Quantity: ${candidate.suggestedRestockQuantity}

Output strictly valid JSON:
{
  "recommendations": [
    {
      "productId": "${candidate.productId}",
      "priority": "HIGH" | "MEDIUM" | "LOW",
      "reason": "Detailed 2-3 sentence replenishment justification and stockout risk assessment",
      "demandTrend": "UP" | "DOWN" | "STABLE" | "INSUFFICIENT_DATA",
      "confidence": "HIGH" | "MEDIUM" | "LOW",
      "warnings": ["specific operational warnings if any"]
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: getModelName(),
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const rawText = response.text;
    if (!rawText) return null;

    const parsed = JSON.parse(rawText);
    const validated = AiRestockValidation.geminiOutputZodSchema.safeParse(parsed);
    if (!validated.success || validated.data.recommendations.length === 0) {
      return null;
    }

    const rec = validated.data.recommendations[0];
    return {
      productId: candidate.productId,
      priority: rec.priority,
      reason: rec.reason,
      demandTrend: rec.demandTrend,
      confidence: rec.confidence,
      warnings: rec.warnings || [],
    };
  } catch {
    return null;
  }
};

export const GeminiService = {
  isConfigured,
  getModelName,
  generateRecommendations,
  generateProductExplanation,
};
