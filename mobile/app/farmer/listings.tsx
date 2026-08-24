import { AppIcon } from "@/components/app-icon";
import { AvailabilityBadge } from "@/components/availability-badge";
import { EmptyState } from "@/components/empty-state";
import { AppContext } from "@/context/app-context";
import { formatPrice } from "@/lib/helpers";
import { router } from "expo-router";
import React from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

export default function FarmerListingsScreen() {
  const { currentUser, products, deleteProduct, markSoldOut } =
    React.use(AppContext);
  const myProducts = products.filter((p) => p.supplierId === currentUser?.id);

  const handleDelete = (id: string, name: string) => {
    Alert.alert("Delete Product", `Remove "${name}" from your listings?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteProduct(id),
      },
    ]);
  };

  const handleSoldOut = (id: string, name: string) => {
    Alert.alert("Mark Sold Out", `Mark "${name}" as sold out?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Confirm", onPress: () => markSoldOut(id) },
    ]);
  };

  if (myProducts.length === 0) {
    return (
      <EmptyState
        icon="cube-outline"
        title="No Listings"
        message="You haven't listed any products yet."
        actionLabel="Add Product"
        onAction={() => router.push("/products/create")}
      />
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-muted"
      contentContainerClassName="p-4 pb-10"
    >
      <Text className="mb-4 text-[13px] text-muted-foreground">
        {myProducts.length} listing{myProducts.length !== 1 ? "s" : ""}
      </Text>

      <View className="gap-3">
        {myProducts.map((product) => (
          <View
            key={product.id}
            className="overflow-hidden rounded-[14px] bg-card shadow-sm"
          >
            <Pressable
              onPress={() => router.push(`/products/${product.id}`)}
              className="p-4 active:bg-muted"
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  <Text className="text-[17px] font-bold text-foreground">
                    {product.name}
                  </Text>
                  <Text className="mt-1 text-[15px] font-semibold text-primary">
                    {formatPrice(product.price)} / {product.unit}
                  </Text>
                  <Text className="mt-1 text-[13px] text-muted-foreground">
                    Qty: {product.quantity} - {product.location}
                  </Text>
                </View>
                <AvailabilityBadge status={product.availability} size="sm" />
              </View>
            </Pressable>

            {/* Actions */}
            <View className="flex-row border-t border-border">
              <Pressable
                onPress={() =>
                  router.push(`/farmer/edit-product/${product.id}`)
                }
                className="flex-1 flex-row items-center justify-center gap-1 py-3 active:bg-muted"
              >
                <AppIcon name="create-outline" size={15} color="#16A34A" />
                <Text className="text-[13px] font-semibold text-primary">
                  Edit
                </Text>
              </Pressable>
              {product.availability !== "sold_out" && (
                <Pressable
                  onPress={() => handleSoldOut(product.id, product.name)}
                  className="flex-1 flex-row items-center justify-center gap-1 border-l border-border py-3 active:bg-muted"
                >
                  <AppIcon name="ban-outline" size={15} color="#D97706" />
                  <Text className="text-[13px] font-semibold text-accent">
                    Sold Out
                  </Text>
                </Pressable>
              )}
              <Pressable
                onPress={() => handleDelete(product.id, product.name)}
                className="flex-1 flex-row items-center justify-center gap-1 border-l border-border py-3 active:bg-destructive/10"
              >
                <AppIcon name="trash-outline" size={15} color="#EF4444" />
                <Text className="text-[13px] font-semibold text-destructive">
                  Delete
                </Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>

      <Pressable
        onPress={() => router.push("/products/create")}
        className="mt-5 flex-row items-center justify-center gap-2 rounded-[10px] bg-primary py-4 active:opacity-90"
      >
        <AppIcon name="add-circle-outline" size={18} color="#FFFFFF" />
        <Text className="text-[15px] font-bold text-primary-foreground">
          Add New Product
        </Text>
      </Pressable>
    </ScrollView>
  );
}
