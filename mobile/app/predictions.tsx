import { AppIcon, type AppIconName } from "@/components/app-icon";
import React from "react";
import { View, Text, ScrollView } from "react-native";

type PreviewItem = {
  icon: AppIconName;
  title: string;
  desc: string;
};

export default function PredictionsScreen() {
  const previewItems: PreviewItem[] = [
    {
      icon: "bar-chart-outline",
      title: "Price Trend Charts",
      desc: "Visualize price trends for maize, tomatoes, and other crops over time.",
    },
    {
      icon: "sparkles-outline",
      title: "Future Price Estimates",
      desc: "Machine learning models will predict price changes based on seasons and supply.",
    },
    {
      icon: "location-outline",
      title: "Location-Based Analysis",
      desc: "Prices may vary by region. Get predictions specific to your area.",
    },
    {
      icon: "warning-outline",
      title: "Estimates Only",
      desc: "Predictions are based on historical data and patterns. Actual prices may differ.",
    },
  ];

  return (
    <ScrollView
      className="flex-1 bg-muted"
      contentContainerClassName="p-4 pb-10"
    >
      {/* Placeholder hero */}
      <View className="mb-5 items-center rounded-[20px] bg-card py-10">
        <AppIcon
          name="trending-up-outline"
          size={66}
          color="#16A34A"
          style={{ marginBottom: 16 }}
        />
        <Text className="text-2xl font-extrabold text-foreground">
          Price Predictions
        </Text>
        <Text className="mt-2 px-6 text-center text-[15px] text-muted-foreground">
          AI-powered price trend analysis for Zambian agricultural products.
        </Text>
        <View className="mt-5 flex-row items-center gap-2 rounded-full bg-accent/15 px-5 py-3">
          <AppIcon name="rocket-outline" size={17} color="#D97706" />
          <Text className="text-[15px] font-bold text-accent">
            Coming Soon
          </Text>
        </View>
      </View>

      {/* Mock preview */}
      <Text className="mb-3 text-[17px] font-bold text-foreground">
        What to Expect
      </Text>
      {previewItems.map((item) => (
        <View
          key={item.title}
          className="mb-2 flex-row gap-3 rounded-[10px] bg-card p-4 shadow-sm"
        >
          <AppIcon name={item.icon} size={28} color="#16A34A" />
          <View className="flex-1">
            <Text className="text-[15px] font-semibold text-foreground">
              {item.title}
            </Text>
            <Text className="mt-1 text-[13px] leading-5 text-muted-foreground">
              {item.desc}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
