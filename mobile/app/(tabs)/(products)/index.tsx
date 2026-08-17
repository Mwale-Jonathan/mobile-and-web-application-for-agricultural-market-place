import { AppIcon } from "@/components/app-icon";
import { CategoryChips } from "@/components/category-chips";
import { EmptyState } from "@/components/empty-state";
import { ProductCard } from "@/components/product-card";
import { Colors } from "@/constants";
import { AppContext } from "@/context/app-context";
import { CATEGORIES } from "@/data/mock-data";
import { cn } from "@/lib/utils";
import { useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";

type SortOption = "newest" | "price_low" | "price_high" | "name";

export default function ProductListScreen() {
  const { products, allUsers } = React.use(AppContext);
  const params = useLocalSearchParams<{ category?: string }>();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    params.category || null,
  );
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showSort, setShowSort] = useState(false);

  const getSupplierName = React.useCallback(
    (supplierId: string) =>
      allUsers.find((u) => u.id === supplierId)?.name || "Unknown",
    [allUsers],
  );

  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => p.availability !== "hidden");

    if (selectedCategory) {
      result = result.filter((p) => p.categoryId === selectedCategory);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q) ||
          p.categoryId.toLowerCase().includes(q) ||
          getSupplierName(p.supplierId).toLowerCase().includes(q),
      );
    }

    switch (sortBy) {
      case "price_low":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price_high":
        result.sort((a, b) => b.price - a.price);
        break;
      case "name":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "newest":
      default:
        result.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
    }

    return result;
  }, [products, selectedCategory, search, sortBy, getSupplierName]);

  const sortLabels: Record<SortOption, string> = {
    newest: "Newest First",
    price_low: "Price: Low to High",
    price_high: "Price: High to Low",
    name: "Name A-Z",
  };

  return (
    <View className="flex-1 bg-muted">
      {/* Search Bar */}
      <View className="px-4 py-3">
        <View className="flex-row items-center rounded-[10px] border border-border bg-card px-3">
          <AppIcon name="search-outline" size={18} color="#6B7280" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search products, suppliers, locations..."
            placeholderTextColor={Colors.textTertiary}
            className="ml-2 flex-1 py-3 text-[15px] text-foreground"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")} className="p-1">
              <AppIcon name="close-outline" size={19} color="#6B7280" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Category Chips */}
      <View className="mb-2">
        <CategoryChips
          categories={CATEGORIES}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />
      </View>

      {/* Sort bar */}
      <View className="flex-row items-center justify-between px-4 py-2">
        <Text className="text-[13px] tabular-nums text-muted-foreground">
          {filteredProducts.length} product
          {filteredProducts.length !== 1 ? "s" : ""}
        </Text>
        <Pressable
          onPress={() => setShowSort(!showSort)}
          className="flex-row items-center gap-1"
        >
          <Text className="text-[13px] font-semibold text-primary">
            {sortLabels[sortBy]}
          </Text>
          <AppIcon
            name={showSort ? "chevron-up-outline" : "chevron-down-outline"}
            size={14}
            color="#111827"
          />
        </Pressable>
      </View>

      {/* Sort dropdown */}
      {showSort && (
        <View className="mx-4 mb-2 overflow-hidden rounded-[10px] border border-border bg-card">
          {(Object.keys(sortLabels) as SortOption[]).map((option) => (
            <Pressable
              key={option}
              onPress={() => {
                setSortBy(option);
                setShowSort(false);
              }}
              className={cn(
                "border-b border-border px-4 py-3 active:bg-muted",
                sortBy === option && "bg-primary/10",
              )}
            >
              <Text
                className={cn(
                  "text-[15px]",
                  sortBy === option
                    ? "font-semibold text-primary"
                    : "font-normal text-foreground",
                )}
              >
                {sortLabels[option]}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Product List */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperClassName="gap-3 px-4"
        contentContainerClassName="gap-3 pb-8"
        contentInsetAdjustmentBehavior="automatic"
        renderItem={({ item }) => (
          <View className="w-50">
            <ProductCard
              product={item}
              supplierName={getSupplierName(item.supplierId)}
            />
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="search-outline"
            title="No Products Found"
            message={
              search
                ? `No products match "${search}". Try a different search term.`
                : "No products available in this category yet."
            }
            actionLabel="Clear Filters"
            onAction={() => {
              setSearch("");
              setSelectedCategory(null);
            }}
          />
        }
      />
    </View>
  );
}
