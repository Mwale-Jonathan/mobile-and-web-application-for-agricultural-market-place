import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { AppIcon } from "@/components/app-icon";
import { AppContext } from "@/context/app-context";
import { Colors } from "@/constants";
import { CATEGORIES } from "@/data/mock-data";
import type { ProductUnit, AvailabilityStatus } from "@/types";
import { cn } from "@/lib/utils";

const UNITS: ProductUnit[] = [
  "kg",
  "25kg bag",
  "50kg bag",
  "crate",
  "bunch",
  "tonne",
  "litre",
  "piece",
];

export default function CreateProductScreen() {
  const { currentUser, addProduct } = React.use(AppContext);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState<ProductUnit>("kg");
  const [quantity, setQuantity] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState(currentUser?.location || "");

  const handleSubmit = () => {
    if (!name.trim() || !categoryId || !price || !quantity) {
      Alert.alert(
        "Error",
        "Please fill in all required fields (name, category, price, quantity)",
      );
      return;
    }
    addProduct({
      name: name.trim(),
      categoryId,
      price: parseFloat(price),
      unit,
      quantity: parseInt(quantity, 10),
      description: description.trim(),
      imageUrl:
        "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400&h=300&fit=crop",
      supplierId: currentUser?.id || "",
      location: location.trim() || currentUser?.location || "Lusaka",
      province: currentUser?.province || "Lusaka",
      latitude: -15.3875 + (Math.random() - 0.5) * 0.5,
      longitude: 28.3228 + (Math.random() - 0.5) * 0.5,
      availability: "available" as AvailabilityStatus,
    });
    Alert.alert("Success", "Product listed successfully!", [
      { text: "OK", onPress: () => router.back() },
    ]);
  };

  return (
    <ScrollView
      className="flex-1 bg-muted"
      contentContainerClassName="p-4 pb-10"
      keyboardShouldPersistTaps="handled"
    >
      {/* Image placeholder */}
      <Pressable className="mb-5 h-40 items-center justify-center rounded-[14px] border-2 border-dashed border-border bg-muted">
        <AppIcon
          name="camera-outline"
          size={42}
          color="#6B7280"
          style={{ marginBottom: 8 }}
        />
        <Text className="text-[15px] font-semibold text-muted-foreground">
          Add Product Photo
        </Text>
        <Text className="mt-1 text-[11px] text-muted-foreground">
          Tap to upload (demo)
        </Text>
      </Pressable>

      {/* Product Name */}
      <Text className="mb-2 text-[13px] font-semibold text-foreground">
        Product Name *
      </Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="e.g. White Maize, Tomatoes"
        placeholderTextColor={Colors.textTertiary}
        className="mb-4 rounded-[10px] border border-border bg-card px-4 py-3 text-[15px] text-foreground"
      />

      {/* Category */}
      <Text className="mb-2 text-[13px] font-semibold text-foreground">
        Category *
      </Text>
      <View className="mb-4 flex-row flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat.id}
            onPress={() => setCategoryId(cat.id)}
            className={cn(
              "flex-row items-center gap-1.5 rounded-full border px-3 py-2",
              categoryId === cat.id
                ? "border-primary bg-primary"
                : "border-border bg-card",
            )}
          >
            <Text className="text-sm">{cat.icon}</Text>
            <Text
              className={cn(
                "text-[13px] font-semibold",
                categoryId === cat.id
                  ? "text-primary-foreground"
                  : "text-foreground",
              )}
            >
              {cat.name}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Price & Unit */}
      <View className="mb-4 flex-row gap-3">
        <View className="flex-1">
          <Text className="mb-2 text-[13px] font-semibold text-foreground">
            Price (ZMW) *
          </Text>
          <TextInput
            value={price}
            onChangeText={setPrice}
            placeholder="0"
            placeholderTextColor={Colors.textTertiary}
            keyboardType="numeric"
            className="rounded-[10px] border border-border bg-card px-4 py-3 text-[15px] text-foreground"
          />
        </View>
        <View className="flex-1">
          <Text className="mb-2 text-[13px] font-semibold text-foreground">
            Quantity *
          </Text>
          <TextInput
            value={quantity}
            onChangeText={setQuantity}
            placeholder="0"
            placeholderTextColor={Colors.textTertiary}
            keyboardType="numeric"
            className="rounded-[10px] border border-border bg-card px-4 py-3 text-[15px] text-foreground"
          />
        </View>
      </View>

      {/* Unit */}
      <Text className="mb-2 text-[13px] font-semibold text-foreground">
        Unit *
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-4"
        contentContainerClassName="gap-2"
      >
        {UNITS.map((u) => (
          <Pressable
            key={u}
            onPress={() => setUnit(u)}
            className={cn(
              "rounded-full border px-4 py-2",
              unit === u ? "border-primary bg-primary" : "border-border bg-card",
            )}
          >
            <Text
              className={cn(
                "text-[13px] font-semibold",
                unit === u ? "text-primary-foreground" : "text-foreground",
              )}
            >
              {u}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Description */}
      <Text className="mb-2 text-[13px] font-semibold text-foreground">
        Description
      </Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="Describe your product..."
        placeholderTextColor={Colors.textTertiary}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        className="mb-4 min-h-[100px] rounded-[10px] border border-border bg-card px-4 py-3 text-[15px] text-foreground"
      />

      {/* Location */}
      <Text className="mb-2 text-[13px] font-semibold text-foreground">
        Location
      </Text>
      <TextInput
        value={location}
        onChangeText={setLocation}
        placeholder="e.g. Chongwe, Kafue"
        placeholderTextColor={Colors.textTertiary}
        className="mb-6 rounded-[10px] border border-border bg-card px-4 py-3 text-[15px] text-foreground"
      />

      {/* Submit */}
      <Pressable
        onPress={handleSubmit}
        className="items-center rounded-[10px] bg-primary py-4 active:opacity-90"
      >
        <Text className="text-[17px] font-bold text-primary-foreground">
          List Product
        </Text>
      </Pressable>
    </ScrollView>
  );
}
