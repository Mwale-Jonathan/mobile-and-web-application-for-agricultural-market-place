import { AppIcon } from "@/components/app-icon";
import { AvailabilityBadge } from "@/components/availability-badge";
import { ContactButtons } from "@/components/contact-buttons";
import { EmptyState } from "@/components/empty-state";
import { AppContext } from "@/context/app-context";
import { CATEGORIES } from "@/data/mock-data";
import { formatDate, formatPrice, getInitials } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    getProductById,
    getUserById,
    products,
    allUsers,
    toggleSaved,
    isSaved,
  } = React.use(AppContext);

  const product = getProductById(id);
  if (!product) {
    return (
      <EmptyState
        icon="search-outline"
        title="Product Not Found"
        message="This product may have been removed."
        actionLabel="Go Back"
        onAction={() => router.back()}
      />
    );
  }

  const supplier = getUserById(product.supplierId);
  const category = CATEGORIES.find((c) => c.id === product.categoryId);
  const saved = isSaved(product.id);

  // Find same-product listings from other suppliers
  const comparisons = products.filter(
    (p) =>
      p.name.toLowerCase() === product.name.toLowerCase() &&
      p.id !== product.id &&
      p.availability !== "hidden",
  );

  return (
    <ScrollView className="flex-1 bg-muted" contentContainerClassName="pb-10">
      {/* Product Image */}
      <Image
        source={{ uri: product.imageUrl }}
        style={{ width: "100%", height: 280 }}
        contentFit="cover"
      />

      {/* Main Info */}
      <View className="p-4">
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <Text className="text-2xl font-extrabold text-foreground">
              {product.name}
            </Text>
            {category && (
              <View className="mt-1 flex-row items-center gap-1">
                <Text className="text-sm">{category.icon}</Text>
                <Text className="text-[13px] text-muted-foreground">
                  {category.name}
                </Text>
              </View>
            )}
          </View>
          <Pressable
            onPress={() => toggleSaved(product.id)}
            className={cn(
              "size-11 items-center justify-center rounded-full",
              saved ? "bg-destructive/10" : "bg-muted",
            )}
          >
            <AppIcon
              name={saved ? "heart" : "heart-outline"}
              size={23}
              color={saved ? "#EF4444" : "#6B7280"}
            />
          </Pressable>
        </View>

        {/* Price */}
        <View className="mt-4 flex-row items-baseline gap-2">
          <Text className="text-[32px] font-extrabold text-primary">
            {formatPrice(product.price)}
          </Text>
          <Text className="text-[17px] text-muted-foreground">
            per {product.unit}
          </Text>
        </View>

        {/* Status & Quantity */}
        <View className="mt-3 flex-row items-center gap-4">
          <AvailabilityBadge status={product.availability} />
          <Text className="text-[13px] tabular-nums text-muted-foreground">
            Qty: {product.quantity.toLocaleString()} {product.unit}
            {product.quantity !== 1 ? "s" : ""}
          </Text>
        </View>

        {/* Description */}
        <View className="mt-5 rounded-[14px] bg-card p-4">
          <Text className="mb-2 text-[15px] font-semibold text-foreground">
            Description
          </Text>
          <Text
            selectable
            className="text-[15px] leading-6 text-muted-foreground"
          >
            {product.description}
          </Text>
        </View>

        {/* Location */}
        <View className="mt-3 flex-row items-center gap-2 rounded-[14px] bg-card p-4">
          <AppIcon name="location-outline" size={24} color="#16A34A" />
          <View className="flex-1">
            <Text className="text-[15px] font-semibold text-foreground">
              {product.location}
            </Text>
            <Text className="text-[13px] text-muted-foreground">
              {product.province} Province
            </Text>
          </View>
        </View>

        {/* Supplier Info */}
        {supplier && (
          <Pressable
            onPress={() => router.push(`/suppliers/${supplier.id}`)}
            className="mt-3 flex-row items-center gap-3 rounded-[14px] bg-card p-4 active:bg-muted"
          >
            <View
              className="size-12 items-center justify-center rounded-full"
              style={{ backgroundColor: supplier.avatarColor }}
            >
              <Text className="text-lg font-bold text-primary-foreground">
                {getInitials(supplier.name)}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-bold text-foreground">
                {supplier.name}
              </Text>
              <Text className="text-[13px] text-muted-foreground">
                {supplier.location} - Joined {formatDate(supplier.joinedDate)}
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Text className="font-semibold text-primary">View</Text>
              <AppIcon name="arrow-forward" size={15} color="#16A34A" />
            </View>
          </Pressable>
        )}

        {/* Contact Buttons */}
        {supplier && (
          <View className="mt-4">
            <ContactButtons phone={supplier.phone} productName={product.name} />
          </View>
        )}

        {/* Price Comparison */}
        {comparisons.length > 0 && (
          <View className="mt-6">
            <Text className="mb-3 text-xl font-bold text-foreground">
              Price Comparison
            </Text>
            <Text className="mb-3 text-[13px] text-muted-foreground">
              Other suppliers selling {product.name}
            </Text>

            <View className="overflow-hidden rounded-[14px] bg-card">
              {/* Current product - highlighted */}
              <View className="flex-row items-center border-l-4 border-primary bg-primary/10 p-3">
                <View className="flex-1">
                  <View className="flex-row items-center gap-1">
                    <Text className="text-[13px] font-semibold text-foreground">
                      {supplier?.name}
                    </Text>
                    <AppIcon name="star" size={13} color="#F59E0B" />
                  </View>
                  <Text className="text-[11px] text-muted-foreground">
                    {product.location}
                  </Text>
                </View>
                <Text className="text-[17px] font-bold text-primary">
                  {formatPrice(product.price)}
                </Text>
              </View>

              {comparisons
                .sort((a, b) => a.price - b.price)
                .map((comp) => {
                  const compSupplier = allUsers.find(
                    (u) => u.id === comp.supplierId,
                  );
                  return (
                    <Pressable
                      key={comp.id}
                      onPress={() => router.push(`/products/${comp.id}`)}
                      className="flex-row items-center border-t border-border p-3 active:bg-muted"
                    >
                      <View className="flex-1">
                        <Text className="text-[13px] font-semibold text-foreground">
                          {compSupplier?.name}
                        </Text>
                        <Text className="text-[11px] text-muted-foreground">
                          {comp.location}
                        </Text>
                      </View>
                      <Text
                        className={cn(
                          "text-[17px] font-bold",
                          comp.price < product.price
                            ? "text-primary"
                            : comp.price > product.price
                              ? "text-destructive"
                              : "text-foreground",
                        )}
                      >
                        {formatPrice(comp.price)}
                      </Text>
                    </Pressable>
                  );
                })}
            </View>
          </View>
        )}

        {/* Listed date */}
        <Text className="mt-6 text-center text-[11px] text-muted-foreground">
          Listed on {formatDate(product.createdAt)}
        </Text>
      </View>
    </ScrollView>
  );
}
