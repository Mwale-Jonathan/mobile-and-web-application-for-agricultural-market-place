import { AppIcon } from "@/components/app-icon";
import { AppContext } from "@/context/app-context";
import { formatPrice } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import { router } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

export default function PriceCompareScreen() {
  const { products, allUsers } = React.use(AppContext);

  const productGroups = useMemo(() => {
    const groups = new Map<string, typeof products>();
    products
      .filter((p) => p.availability !== "hidden")
      .forEach((p) => {
        const key = p.name.toLowerCase();
        const existing = groups.get(key) || [];
        existing.push(p);
        groups.set(key, existing);
      });
    return Array.from(groups.entries())
      .filter(([, items]) => items.length >= 2)
      .sort((a, b) => a[0].localeCompare(b[0]));
  }, [products]);

  const getName = (sid: string) =>
    allUsers.find((u) => u.id === sid)?.name || "Unknown";

  return (
    <ScrollView
      className="flex-1 bg-muted"
      contentContainerClassName="p-4 pb-10"
    >
      <Text className="mb-4 text-[13px] text-muted-foreground">
        Compare prices across suppliers for the same product.
      </Text>

      {productGroups.length === 0 ? (
        <View className="items-center p-6">
          <AppIcon
            name="bar-chart-outline"
            size={44}
            color="#16A34A"
            style={{ marginBottom: 12 }}
          />
          <Text className="text-center text-[15px] text-muted-foreground">
            No products with multiple suppliers to compare yet.
          </Text>
        </View>
      ) : (
        <View className="gap-5">
          {productGroups.map(([name, items]) => {
            const sorted = [...items].sort((a, b) => a.price - b.price);
            const min = sorted[0].price;
            const max = sorted[sorted.length - 1].price;
            return (
              <View
                key={name}
                className="overflow-hidden rounded-[14px] bg-card shadow-sm"
              >
                <View className="border-b border-border bg-primary/10 p-4">
                  <Text className="text-[17px] font-bold text-foreground">
                    {sorted[0].name}
                  </Text>
                  <Text className="mt-1 text-[13px] text-muted-foreground">
                    {sorted.length} suppliers - {formatPrice(min)} to{" "}
                    {formatPrice(max)} per {sorted[0].unit}
                  </Text>
                </View>
                {sorted.map((p, i) => (
                  <Pressable
                    key={p.id}
                    onPress={() => router.push(`/products/${p.id}`)}
                    className={cn(
                      "flex-row items-center p-3 active:bg-muted",
                      i > 0 && "border-t border-border",
                      i === 0 && "border-l-[3px] border-primary bg-primary/5",
                    )}
                  >
                    <View className="flex-1">
                      <View className="flex-row items-center gap-1">
                        <Text className="text-[15px] font-semibold text-foreground">
                          {getName(p.supplierId)}
                        </Text>
                        {i === 0 && (
                          <AppIcon name="star" size={14} color="#F59E0B" />
                        )}
                      </View>
                      <Text className="text-[11px] text-muted-foreground">
                        {p.location}, {p.province}
                      </Text>
                    </View>
                    <Text
                      className={cn(
                        "text-[17px] font-bold",
                        i === 0 ? "text-primary" : "text-foreground",
                      )}
                    >
                      {formatPrice(p.price)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}
