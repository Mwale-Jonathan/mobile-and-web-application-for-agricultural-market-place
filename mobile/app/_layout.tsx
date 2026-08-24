import "../global.css";

import { AppProvider } from "@/context/app-context";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";

export default function RootLayout() {
  return (
    <AppProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="products/[id]"
          options={{ headerShown: true, title: "Product Details" }}
        />
        <Stack.Screen
          name="suppliers/[id]"
          options={{ headerShown: true, title: "Supplier Profile" }}
        />
        <Stack.Screen
          name="products/create"
          options={{
            headerShown: true,
            title: "Add Product",
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="farmer/listings"
          options={{ headerShown: true, title: "My Listings" }}
        />
        <Stack.Screen
          name="farmer/edit-product/[id]"
          options={{ headerShown: true, title: "Edit Product" }}
        />
        <Stack.Screen
          name="saved"
          options={{ headerShown: true, title: "Saved Products" }}
        />
        <Stack.Screen
          name="price-compare"
          options={{ headerShown: true, title: "Price Comparison" }}
        />
        <Stack.Screen
          name="predictions"
          options={{ headerShown: true, title: "Price Predictions" }}
        />
        <Stack.Screen name="+not-found" />
      </Stack>
    </AppProvider>
  );
}
