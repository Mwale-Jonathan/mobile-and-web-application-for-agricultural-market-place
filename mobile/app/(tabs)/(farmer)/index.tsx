import { AppIcon } from "@/components/app-icon";
import { AvailabilityBadge } from "@/components/availability-badge";
import { AppContext } from "@/context/app-context";
import { formatPrice } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import { router } from "expo-router";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

export default function FarmerDashboard() {
  const { currentUser, products } = React.use(AppContext);

  const myProducts = products.filter((p) => p.supplierId === currentUser?.id);
  const activeCount = myProducts.filter(
    (p) => p.availability === "available" || p.availability === "limited",
  ).length;
  const soldOutCount = myProducts.filter(
    (p) => p.availability === "sold_out",
  ).length;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      className="flex-1 bg-muted"
      contentContainerClassName="pb-8"
    >
      {/* Stats */}
      <View className="flex-row gap-3 p-4">
        {[
          { label: "Total", value: myProducts.length, color: "text-primary" },
          { label: "Active", value: activeCount, color: "text-primary" },
          { label: "Sold Out", value: soldOutCount, color: "text-destructive" },
        ].map((stat) => (
          <View
            key={stat.label}
            className="flex-1 items-center rounded-[14px] bg-card p-4 shadow-sm"
          >
            <Text
              className={cn("text-2xl font-extrabold tabular-nums", stat.color)}
            >
              {stat.value}
            </Text>
            <Text className="mt-0.5 text-[11px] font-semibold text-muted-foreground">
              {stat.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Quick Actions */}
      <View className="gap-2 px-4">
        <Pressable
          onPress={() => router.push("/products/create")}
          className="flex-row items-center gap-3 rounded-[10px] bg-primary p-4 active:opacity-90"
        >
          <AppIcon name="add-circle-outline" size={28} color="#FFFFFF" />
          <View className="flex-1">
            <Text className="text-[17px] font-bold text-primary-foreground">
              Add New Product
            </Text>
            <Text className="text-[13px] text-primary-foreground/80">
              List your produce for buyers
            </Text>
          </View>
        </Pressable>

        <Pressable
          onPress={() => router.push("/farmer/listings")}
          className="flex-row items-center gap-3 rounded-[10px] border border-border bg-card p-4 active:bg-muted"
        >
          <AppIcon name="list-outline" size={28} color="#16A34A" />
          <View className="flex-1">
            <Text className="text-[17px] font-semibold text-foreground">
              Manage Listings
            </Text>
            <Text className="text-[13px] text-muted-foreground">
              Edit, delete, or update stock
            </Text>
          </View>
          <AppIcon name="arrow-forward" size={17} color="#6B7280" />
        </Pressable>
      </View>

      {/* Recent Listings */}
      <View className="mt-6 px-4">
        <Text className="mb-3 text-xl font-bold text-foreground">
          Recent Listings
        </Text>

        {myProducts.length === 0 ? (
          <View className="items-center rounded-[14px] bg-card p-6">
            <AppIcon
              name="leaf-outline"
              size={44}
              color="#16A34A"
              style={{ marginBottom: 12 }}
            />
            <Text className="text-[15px] font-semibold text-foreground">
              No Listings Yet
            </Text>
            <Text className="mt-1 text-center text-[13px] text-muted-foreground">
              Add your first product to start selling on AgriMart
            </Text>
          </View>
        ) : (
          <View className="gap-2">
            {myProducts.slice(0, 5).map((product) => (
              <Pressable
                key={product.id}
                onPress={() => router.push(`/products/${product.id}`)}
                className="flex-row items-center gap-3 rounded-[10px] bg-card p-4 shadow-sm active:bg-muted"
              >
                <View className="flex-1">
                  <Text className="text-[15px] font-semibold text-foreground">
                    {product.name}
                  </Text>
                  <Text className="mt-0.5 text-[13px] text-muted-foreground">
                    {formatPrice(product.price)} / {product.unit} - Qty:{" "}
                    {product.quantity}
                  </Text>
                </View>
                <AvailabilityBadge status={product.availability} size="sm" />
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
