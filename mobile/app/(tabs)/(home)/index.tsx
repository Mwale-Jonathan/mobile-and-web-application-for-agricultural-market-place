import React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { Link, router } from "expo-router";
import { AppIcon, type AppIconName } from "@/components/app-icon";
import { AppContext } from "@/context/app-context";
import { CATEGORIES } from "@/data/mock-data";
import { ProductCard } from "@/components/product-card";

type QuickLink = {
  icon: AppIconName;
  label: string;
  href: "/price-compare" | "/saved" | "/predictions";
};

export default function HomeScreen() {
  const { currentUser, products, allUsers } = React.use(AppContext);
  const isFarmer = currentUser?.role === "farmer";

  const featuredProducts = products
    .filter((p) => p.availability !== "hidden" && p.availability !== "sold_out")
    .slice(0, 6);

  const getSupplierName = (supplierId: string) =>
    allUsers.find((u) => u.id === supplierId)?.name || "Unknown";

  const quickLinks: QuickLink[] = [
    {
      icon: "bar-chart-outline",
      label: "Price Comparison",
      href: "/price-compare",
    },
    { icon: "bookmark-outline", label: "Saved Products", href: "/saved" },
    {
      icon: "trending-up-outline",
      label: "Price Predictions",
      href: "/predictions",
    },
  ];

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      className="flex-1 bg-muted"
      contentContainerClassName="pb-8"
    >
      {/* Welcome Hero */}
      <View className="mx-4 mt-4 overflow-hidden rounded-[20px] bg-primary p-6">
        <Text className="text-[13px] font-medium text-primary-foreground/80">
          Welcome back,
        </Text>
        <View className="mt-0.5 flex-row items-center gap-2">
          <Text className="text-2xl font-extrabold text-primary-foreground">
            {currentUser?.name || "User"}
          </Text>
          <AppIcon name="hand-left-outline" size={24} color="#FFFFFF" />
        </View>
        <Text className="mt-2 text-[13px] leading-5 text-primary-foreground/75">
          {isFarmer
            ? "Manage your produce listings and connect with buyers across Zambia."
            : "Find fresh produce, compare prices, and connect with local farmers."}
        </Text>

        {/* Quick Actions */}
        <View className="mt-5 flex-row gap-3">
          <Pressable
            onPress={() =>
              isFarmer
                ? router.push("/products/create")
                : router.push("/(tabs)/(products)")
            }
            className="flex-1 items-center rounded-[10px] bg-primary-foreground/90 py-3 active:bg-primary-foreground"
          >
            <AppIcon
              name={isFarmer ? "add-circle-outline" : "basket-outline"}
              size={24}
              color="#16A34A"
              style={{ marginBottom: 4 }}
            />
            <Text className="text-[13px] font-bold text-primary">
              {isFarmer ? "Add Product" : "Browse"}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/(tabs)/(map)")}
            className="flex-1 items-center rounded-[10px] bg-primary-foreground/90 py-3 active:bg-primary-foreground"
          >
            <AppIcon
              name="location-outline"
              size={24}
              color="#16A34A"
              style={{ marginBottom: 4 }}
            />
            <Text className="text-[13px] font-bold text-primary">Nearby</Text>
          </Pressable>
          {isFarmer && (
            <Pressable
              onPress={() => router.push("/farmer/listings")}
              className="flex-1 items-center rounded-[10px] bg-primary-foreground/90 py-3 active:bg-primary-foreground"
            >
              <AppIcon
                name="list-outline"
                size={24}
                color="#16A34A"
                style={{ marginBottom: 4 }}
              />
              <Text className="text-[13px] font-bold text-primary">
                Listings
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Categories */}
      <View className="mt-6">
        <Text className="mx-4 mb-3 text-xl font-bold text-foreground">
          Categories
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-3 px-4"
        >
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat.id}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/(products)",
                  params: { category: cat.id },
                })
              }
              className="w-[100px] items-center rounded-[14px] bg-card px-2 py-4 shadow-sm active:bg-primary/10"
            >
              <Text className="mb-2 text-[32px]">{cat.icon}</Text>
              <Text className="text-center text-[13px] font-semibold text-foreground">
                {cat.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Featured Products */}
      <View className="mt-6">
        <View className="mx-4 mb-3 flex-row items-center justify-between">
          <Text className="text-xl font-bold text-foreground">
            Featured Products
          </Text>
          <Link href="/(tabs)/(products)" asChild>
            <Pressable className="flex-row items-center gap-1">
              <Text className="text-[13px] font-semibold text-primary">
                View All
              </Text>
              <AppIcon name="arrow-forward" size={14} color="#16A34A" />
            </Pressable>
          </Link>
        </View>

        <View className="flex-row flex-wrap gap-3 px-4">
          {featuredProducts.map((product) => (
            <View key={product.id} className="w-[48%]">
              <ProductCard
                product={product}
                supplierName={getSupplierName(product.supplierId)}
              />
            </View>
          ))}
        </View>
      </View>

      {/* Quick Links */}
      <View className="mt-6 px-4">
        <Text className="mb-3 text-xl font-bold text-foreground">
          Quick Links
        </Text>
        {quickLinks.map((link) => (
          <Link key={link.href} href={link.href} asChild>
            <Pressable className="mb-2 flex-row items-center gap-3 rounded-[10px] bg-card p-4 shadow-sm active:bg-primary/10">
              <AppIcon name={link.icon} size={24} color="#16A34A" />
              <Text className="flex-1 text-[15px] font-semibold text-foreground">
                {link.label}
              </Text>
              <AppIcon name="arrow-forward" size={17} color="#6B7280" />
            </Pressable>
          </Link>
        ))}
      </View>
    </ScrollView>
  );
}
