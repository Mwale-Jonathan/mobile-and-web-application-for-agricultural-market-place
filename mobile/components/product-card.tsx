import React from "react";
import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { AppIcon } from "@/components/app-icon";
import { formatPrice } from "@/lib/helpers";
import type { Product } from "@/types";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  supplierName?: string;
}

export function ProductCard({ product, supplierName }: ProductCardProps) {
  const statusClasses: Record<string, { bg: string; text: string }> = {
    available: { bg: "bg-primary/10", text: "text-primary" },
    limited: { bg: "bg-accent/15", text: "text-accent" },
    sold_out: { bg: "bg-destructive/10", text: "text-destructive" },
    hidden: { bg: "bg-muted", text: "text-muted-foreground" },
  };

  const status = statusClasses[product.availability] || statusClasses.available;

  return (
    <Link href={`/products/${product.id}`} asChild>
      <Pressable className="flex-1 overflow-hidden rounded-[14px] bg-card shadow-sm active:opacity-95">
        <Image
          source={{ uri: product.imageUrl }}
          style={{
            width: "100%",
            height: 140,
          }}
          contentFit="cover"
        />
        <View className="p-3">
          <View className="flex-row items-start justify-between gap-1">
            <Text
              className="flex-1 text-[15px] font-semibold text-foreground"
              numberOfLines={1}
            >
              {product.name}
            </Text>
            <View className={cn("rounded-full px-2 py-0.5", status.bg)}>
              <Text className={cn("text-[11px] font-semibold", status.text)}>
                {product.availability === "available"
                  ? "In Stock"
                  : product.availability === "limited"
                    ? "Limited"
                    : "Sold Out"}
              </Text>
            </View>
          </View>

          <Text className="mt-1 text-[17px] font-bold text-primary">
            {formatPrice(product.price)}
            <Text className="text-[13px] font-normal text-muted-foreground">
              {" "}
              / {product.unit}
            </Text>
          </Text>

          {supplierName && (
            <Text
              className="mt-1 text-[13px] text-muted-foreground"
              numberOfLines={1}
            >
              {supplierName}
            </Text>
          )}

          <View className="mt-1 flex-row items-center gap-1">
            <AppIcon name="location-outline" size={12} color="#6B7280" />
            <Text className="text-[11px] text-muted-foreground">
              {product.location}, {product.province}
            </Text>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}
