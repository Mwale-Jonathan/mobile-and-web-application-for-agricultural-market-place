import { AppIcon } from "@/components/app-icon";
import { AppButton } from "@/components/ui";
import { AppContext } from "@/context/app-context";
import { ApiError } from "@/lib/api";
import { mlApi } from "@/lib/ml-api";
import { cn } from "@/lib/utils";
import type { CommodityCatalogue, PredictionResponse } from "@/types";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

function errorText(error: unknown) {
  if (error instanceof ApiError && error.details && typeof error.details === "object" && "closest" in error.details) {
    const closest = (error.details as { closest?: string[] }).closest;
    return closest?.length ? `${error.message}. Try: ${closest.join(", ")}.` : error.message;
  }
  return error instanceof Error ? error.message : "Unable to load a forecast.";
}

export default function PredictionsScreen() {
  const params = useLocalSearchParams<{ commodity?: string; province?: string; unit?: string; auto?: string }>();
  const { currentUser } = React.use(AppContext);
  const [catalogue, setCatalogue] = useState<CommodityCatalogue | null>(null);
  const [commodity, setCommodity] = useState(params.commodity || "");
  const [province, setProvince] = useState(params.province || currentUser?.province || "");
  const [unit, setUnit] = useState("");
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [loadingCatalogue, setLoadingCatalogue] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoRequested = useRef(false);

  const loadCatalogue = async () => {
    setLoadingCatalogue(true);
    setError(null);
    try {
      const next = await mlApi.catalogue();
      setCatalogue(next);
      const nextCommodity = params.commodity || commodity || next.commodities[0]?.commodity || "";
      setCommodity(nextCommodity);
      const item = next.commodities.find((entry) => entry.commodity.toLowerCase() === nextCommodity.toLowerCase());
      const preferredProvince = params.province || currentUser?.province || "";
      setProvince(item?.provinces.includes(preferredProvince) ? preferredProvince : item?.provinces[0] || preferredProvince);
      setUnit(item?.units.includes(params.unit || "") ? params.unit || "" : item?.units.length === 1 ? item.units[0] : "");
    } catch (nextError) {
      setError(errorText(nextError));
    } finally {
      setLoadingCatalogue(false);
    }
  };

  useEffect(() => { loadCatalogue(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedItem = catalogue?.commodities.find((entry) => entry.commodity.toLowerCase() === commodity.toLowerCase());
  const provinces = selectedItem?.provinces || catalogue?.provinces || [];
  const units = selectedItem?.units || [];

  const runPrediction = async (requestedCommodity = commodity, requestedProvince = province, requestedUnit = unit) => {
    if (!requestedCommodity) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      setResult(await mlApi.predict(requestedCommodity, requestedProvince, requestedUnit));
    } catch (nextError) {
      setError(errorText(nextError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loadingCatalogue && catalogue && params.auto === "1" && commodity && !autoRequested.current) {
      autoRequested.current = true;
      runPrediction(commodity, province, unit);
    }
  }, [catalogue, commodity, loadingCatalogue, params.auto, province, unit]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loadingCatalogue) {
    return (
      <View className="flex-1 items-center justify-center bg-muted px-6">
        <ActivityIndicator size="large" color="#16A34A" />
        <Text className="mt-3 text-muted-foreground">Loading forecast catalogue…</Text>
      </View>
    );
  }

  if (!catalogue) {
    return (
      <View className="flex-1 items-center justify-center bg-muted px-6">
        <AppIcon name="cloud-offline-outline" size={48} color="#6B7280" />
        <Text className="mt-4 text-center text-base text-muted-foreground">{error}</Text>
        <AppButton label="Retry" onPress={loadCatalogue} className="mt-5 w-full" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-muted" contentContainerClassName="p-4 pb-10">
      <View className="mb-5 rounded-[20px] bg-card p-5">
        <View className="flex-row items-center gap-3">
          <View className="size-12 items-center justify-center rounded-full bg-primary/10">
            <AppIcon name="trending-up-outline" size={28} color="#16A34A" />
          </View>
          <View className="flex-1">
            <Text className="text-xl font-extrabold text-foreground">Price Forecast</Text>
            <Text className="mt-1 text-[13px] text-muted-foreground">One-month-ahead province estimates from historical market prices.</Text>
          </View>
        </View>
      </View>

      <Text className="mb-2 text-[13px] font-semibold text-foreground">Commodity</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4" contentContainerClassName="gap-2">
        {catalogue.commodities.map((item) => (
          <Pressable
            key={item.commodity}
            onPress={() => {
              setCommodity(item.commodity);
              setProvince(item.provinces.includes(currentUser?.province || "") ? currentUser?.province || "" : item.provinces[0] || "");
              setUnit(item.units.length === 1 ? item.units[0] : "");
              setResult(null);
            }}
            className={cn("rounded-full border px-4 py-2.5", commodity === item.commodity ? "border-primary bg-primary" : "border-border bg-card")}
          >
            <Text className={cn("text-[13px] font-semibold", commodity === item.commodity ? "text-white" : "text-foreground")}>{item.commodity}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text className="mb-2 text-[13px] font-semibold text-foreground">Province</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4" contentContainerClassName="gap-2">
        {provinces.map((item) => (
          <Pressable key={item} onPress={() => { setProvince(item); setResult(null); }} className={cn("rounded-full border px-4 py-2.5", province === item ? "border-primary bg-primary/10" : "border-border bg-card")}>
            <Text className={cn("text-[13px] font-semibold", province === item ? "text-primary" : "text-foreground")}>{item}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {units.length > 1 && (
        <>
          <Text className="mb-2 text-[13px] font-semibold text-foreground">Unit</Text>
          <View className="mb-5 flex-row flex-wrap gap-2">
            {units.map((item) => (
              <Pressable key={item} onPress={() => { setUnit(item); setResult(null); }} className={cn("rounded-full border px-4 py-2", unit === item ? "border-primary bg-primary/10" : "border-border bg-card")}>
                <Text className={cn("text-[13px] font-semibold", unit === item ? "text-primary" : "text-foreground")}>{item}</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      <AppButton label="Generate Forecast" onPress={() => runPrediction()} loading={loading} disabled={!commodity || !province} />

      {error && (
        <View className="mt-4 rounded-[12px] border border-destructive/30 bg-destructive/10 p-4">
          <Text className="font-semibold text-destructive">Forecast unavailable</Text>
          <Text className="mt-1 text-[13px] leading-5 text-destructive">{error}</Text>
        </View>
      )}

      {result && (
        <View className="mt-5 gap-3">
          <Text className="text-[13px] text-muted-foreground">Matched {result.matched_commodity} ({Math.round(result.match_score * 100)}% match)</Text>
          {result.forecasts.map((forecast) => (
            <View key={`${forecast.province}-${forecast.unit}`} className="rounded-[14px] bg-card p-5 shadow-sm">
              <View className="flex-row items-center justify-between">
                <Text className="text-lg font-bold text-foreground">{forecast.province}</Text>
                <Text className="text-[13px] font-semibold text-muted-foreground">{forecast.forecast_date}</Text>
              </View>
              <Text className="mt-3 text-[32px] font-extrabold text-primary">K {forecast.predicted_price.toFixed(2)}</Text>
              <Text className="text-[13px] text-muted-foreground">per {forecast.unit}</Text>
              <View className="mt-4 rounded-[10px] bg-muted p-3">
                <Text className="text-[13px] text-foreground">Likely range: K {forecast.lower_bound.toFixed(2)} – K {forecast.upper_bound.toFixed(2)}</Text>
                <Text className="mt-1 text-[11px] text-muted-foreground">Last observed: K {forecast.last_observed_price.toFixed(2)} in {forecast.last_observation_date}</Text>
              </View>
              {forecast.warning && <Text className="mt-3 text-[12px] leading-5 text-accent">{forecast.warning}</Text>}
            </View>
          ))}
          <View className="flex-row gap-2 rounded-[12px] bg-accent/10 p-4">
            <AppIcon name="warning-outline" size={20} color="#D97706" />
            <Text className="flex-1 text-[12px] leading-5 text-muted-foreground">Forecasts are estimates based on historical patterns, not guaranteed market prices.</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
