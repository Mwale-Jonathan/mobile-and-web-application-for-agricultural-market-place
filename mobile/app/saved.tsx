import { EmptyState } from "@/components/empty-state";
import { ProductCard } from "@/components/product-card";
import { AppContext } from "@/context/app-context";
import React from "react";
import { ScrollView, View } from "react-native";

export default function SavedProductsScreen() {
  const { savedProducts, products, allUsers } = React.use(AppContext);
  const saved = savedProducts
    .map((s) => products.find((p) => p.id === s.productId))
    .filter(Boolean) as typeof products;
  const getName = (sid: string) =>
    allUsers.find((u) => u.id === sid)?.name || "";

  if (saved.length === 0)
    return (
      <EmptyState
        icon="bookmark-outline"
        title="No Saved Products"
        message="Products you bookmark will appear here. Tap the heart on any product to save it."
      />
    );

  return (
    <ScrollView
      className="flex-1 bg-muted"
      contentContainerClassName="p-4 pb-10"
    >
      <View className="flex-row flex-wrap gap-3">
        {saved.map((p) => (
          <View key={p.id} className="w-[48%]">
            <ProductCard product={p} supplierName={getName(p.supplierId)} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
