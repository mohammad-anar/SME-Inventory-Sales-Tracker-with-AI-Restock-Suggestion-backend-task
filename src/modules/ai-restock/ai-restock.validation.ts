import { z } from "zod";

const getRecommendationsQueryZodSchema = z.object({
  query: z
    .object({
      planningHorizonDays: z
        .string()
        .optional()
        .transform((val) => (val ? Math.max(1, Math.min(90, parseInt(val, 10))) : 7)),
      analysisPeriodDays: z
        .string()
        .optional()
        .transform((val) => (val ? Math.max(7, Math.min(180, parseInt(val, 10))) : 30)),
      priority: z.enum(["HIGH", "MEDIUM", "LOW", "ALL"]).optional(),
      search: z.string().optional(),
      forceRefresh: z
        .string()
        .optional()
        .transform((val) => val === "true"),
    })
    .optional(),
});

const getProductForecastQueryZodSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Product ID is required"),
  }),
  query: z
    .object({
      planningHorizonDays: z
        .string()
        .optional()
        .transform((val) => (val ? Math.max(1, Math.min(90, parseInt(val, 10))) : 7)),
      analysisPeriodDays: z
        .string()
        .optional()
        .transform((val) => (val ? Math.max(7, Math.min(180, parseInt(val, 10))) : 30)),
    })
    .optional(),
});

const geminiItemZodSchema = z.object({
  productId: z.string().min(1),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
  reason: z.string().min(1),
  demandTrend: z.enum(["UP", "DOWN", "STABLE", "INSUFFICIENT_DATA"]).optional(),
  confidence: z.enum(["HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
  warnings: z.array(z.string()).optional(),
});

const geminiOutputZodSchema = z.object({
  recommendations: z.array(geminiItemZodSchema),
});

export const AiRestockValidation = {
  getRecommendationsQueryZodSchema,
  getProductForecastQueryZodSchema,
  geminiOutputZodSchema,
  geminiItemZodSchema,
};
