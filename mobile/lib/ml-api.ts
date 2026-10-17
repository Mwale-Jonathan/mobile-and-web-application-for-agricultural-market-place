import type { CommodityCatalogue, PredictionResponse } from "@/types";
import { ApiError } from "@/lib/api";

const ML_API_URL = (process.env.EXPO_PUBLIC_ML_API_URL || "http://localhost:8000").replace(/\/$/, "");

async function mlRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);
  try {
    const response = await fetch(`${ML_API_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: { Accept: "application/json", "Content-Type": "application/json", ...options.headers },
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      const detail = body?.detail;
      const message = typeof detail === "string" ? detail : detail?.error || `Forecast request failed (${response.status})`;
      throw new ApiError(message, response.status, detail);
    }
    return body as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === "AbortError") throw new ApiError("The forecast service took too long to respond.", 408);
    throw new ApiError("Unable to reach the forecast service.", 0, error);
  } finally {
    clearTimeout(timer);
  }
}

export const mlApi = {
  catalogue: () => mlRequest<CommodityCatalogue>("/commodities"),
  predict: (commodity: string, province?: string, unit?: string) =>
    mlRequest<PredictionResponse>("/predict", {
      method: "POST",
      body: JSON.stringify({ commodity, province: province || null, unit: unit || null }),
    }),
};
