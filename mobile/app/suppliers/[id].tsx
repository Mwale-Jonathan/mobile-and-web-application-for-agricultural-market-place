import React from "react";
import { View, Text, ScrollView } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { AppIcon } from "@/components/app-icon";
import { AppContext } from "@/context/app-context";
import { formatDate, formatPhone, getInitials } from "@/lib/helpers";
import { ProductCard } from "@/components/product-card";
import { ContactButtons } from "@/components/contact-buttons";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";

export default function SupplierProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getUserById, getProductsBySupplier } = React.use(AppContext);
  const supplier = getUserById(id);

  if (!supplier) {
    return (
      <EmptyState
        icon="person-outline"
        title="Not Found"
        message="Supplier unavailable."
        actionLabel="Go Back"
        onAction={() => router.back()}
      />
    );
  }

  const supplierProducts = getProductsBySupplier(supplier.id).filter(
    (p) => p.availability !== "hidden",
  );

  return (
    <ScrollView className="flex-1 bg-muted" contentContainerClassName="pb-10">
      <View className="items-center bg-card p-6">
        <View
          className="mb-3 size-20 items-center justify-center rounded-full"
          style={{ backgroundColor: supplier.avatarColor }}
        >
          <Text className="text-[32px] font-extrabold text-primary-foreground">
            {getInitials(supplier.name)}
          </Text>
        </View>
        <Text className="text-2xl font-extrabold text-foreground">
          {supplier.name}
        </Text>
        <View className="mt-2 flex-row items-center gap-1.5">
          <AppIcon name="location-outline" size={16} color="#6B7280" />
          <Text className="text-[15px] text-muted-foreground">
            {supplier.location}, {supplier.province}
          </Text>
        </View>
        <View className="mt-2 flex-row items-center gap-1.5">
          <AppIcon name="call-outline" size={14} color="#6B7280" />
          <Text selectable className="text-[13px] text-muted-foreground">
            {formatPhone(supplier.phone)}
          </Text>
        </View>
        <Text className="mt-2 text-[11px] text-muted-foreground">
          Joined {formatDate(supplier.joinedDate)}
        </Text>
        <View className="mt-5 w-full">
          <ContactButtons phone={supplier.phone} />
        </View>
      </View>

      <View className="flex-row gap-3 p-4">
        {[
          { v: supplierProducts.length, l: "Products" },
          {
            v: supplierProducts.filter((p) => p.availability === "available")
              .length,
            l: "Active",
          },
        ].map((s) => (
          <View
            key={s.l}
            className="flex-1 items-center rounded-[10px] bg-card p-3"
          >
            <Text
              className={cn(
                "text-2xl font-extrabold",
                s.l === "Active" ? "text-primary" : "text-primary",
              )}
            >
              {s.v}
            </Text>
            <Text className="text-[11px] text-muted-foreground">{s.l}</Text>
          </View>
        ))}
      </View>

      <View className="px-4">
        <Text className="mb-3 text-xl font-bold text-foreground">Products</Text>
        {supplierProducts.length === 0 ? (
          <EmptyState
            icon="cube-outline"
            title="No Products"
            message="No products listed yet."
          />
        ) : (
          <View className="flex-row flex-wrap gap-3">
            {supplierProducts.map((p) => (
              <View key={p.id} className="w-[48%]">
                <ProductCard product={p} />
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
