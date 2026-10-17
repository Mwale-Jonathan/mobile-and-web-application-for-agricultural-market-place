import { EmptyState } from "@/components/empty-state";
import { AppContext } from "@/context/app-context";
import { cn } from "@/lib/utils";
import type { AvailabilityStatus, ProductUnit } from "@/types";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import type { UploadAsset } from "@/lib/api";
import { toUploadAsset } from "@/lib/image-upload";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

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
const STATUSES: { value: AvailabilityStatus; label: string }[] = [
  { value: "available", label: "Available" },
  { value: "limited", label: "Limited Stock" },
  { value: "sold_out", label: "Sold Out" },
  { value: "hidden", label: "Hidden" },
];

export default function EditProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { categories, getProductById, updateProduct } = React.use(AppContext);
  const product = getProductById(id);

  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState<ProductUnit>("kg");
  const [quantity, setQuantity] = useState("");
  const [description, setDescription] = useState("");
  const [availability, setAvailability] =
    useState<AvailabilityStatus>("available");
  const [image, setImage] = useState<UploadAsset | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setCategoryId(product.categoryId);
      setPrice(String(product.price));
      setUnit(product.unit);
      setQuantity(String(product.quantity));
      setDescription(product.description);
      setAvailability(product.availability);
    }
  }, [product]);

  if (!product)
    return (
      <EmptyState
        icon="search-outline"
        title="Not Found"
        message="Product not found."
        actionLabel="Go Back"
        onAction={() => router.back()}
      />
    );

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.75,
    });
    if (result.canceled) return;
    try {
      setImage(toUploadAsset(result.assets[0]));
    } catch (error) {
      Alert.alert("Unsupported photo", error instanceof Error ? error.message : "Choose another image.");
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !price) {
      Alert.alert("Error", "Name and price are required.");
      return;
    }
    setLoading(true);
    try {
      await updateProduct(product.id, {
        name: name.trim(),
        categoryId,
        price: parseFloat(price),
        unit,
        quantity: parseInt(quantity, 10) || 0,
        description: description.trim(),
        availability,
      }, image);
      Alert.alert("Updated", "Product updated successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert("Unable to update product", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-muted"
      contentContainerClassName="p-4 pb-10"
      keyboardShouldPersistTaps="handled"
    >
      <Pressable onPress={pickImage} className="mb-5 h-40 overflow-hidden rounded-[14px] border border-border bg-card">
        <Image
          source={{ uri: image?.uri || product.imageUrl }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
        />
        <View className="absolute bottom-0 left-0 right-0 bg-black/60 py-2">
          <Text className="text-center text-sm font-semibold text-white">Change photo</Text>
        </View>
      </Pressable>

      <Text className="mb-2 text-[13px] font-semibold text-foreground">
        Product Name
      </Text>
      <TextInput
        value={name}
        onChangeText={setName}
        className="mb-4 rounded-[10px] border border-border bg-card px-4 py-3 text-[15px] text-foreground"
      />

      <Text className="mb-2 text-[13px] font-semibold text-foreground">
        Category
      </Text>
      <View className="mb-4 flex-row flex-wrap gap-2">
        {categories.map((cat) => (
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

      <View className="mb-4 flex-row gap-3">
        <View className="flex-1">
          <Text className="mb-2 text-[13px] font-semibold text-foreground">
            Price (ZMW)
          </Text>
          <TextInput
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
            className="rounded-[10px] border border-border bg-card px-4 py-3 text-[15px] text-foreground"
          />
        </View>
        <View className="flex-1">
          <Text className="mb-2 text-[13px] font-semibold text-foreground">
            Quantity
          </Text>
          <TextInput
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
            className="rounded-[10px] border border-border bg-card px-4 py-3 text-[15px] text-foreground"
          />
        </View>
      </View>

      <Text className="mb-2 text-[13px] font-semibold text-foreground">
        Unit
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
              unit === u
                ? "border-primary bg-primary"
                : "border-border bg-card",
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

      <Text className="mb-2 text-[13px] font-semibold text-foreground">
        Status
      </Text>
      <View className="mb-4 flex-row flex-wrap gap-2">
        {STATUSES.map((s) => (
          <Pressable
            key={s.value}
            onPress={() => setAvailability(s.value)}
            className={cn(
              "rounded-full border px-3 py-2",
              availability === s.value
                ? "border-primary bg-primary"
                : "border-border bg-card",
            )}
          >
            <Text
              className={cn(
                "text-[13px] font-semibold",
                availability === s.value
                  ? "text-primary-foreground"
                  : "text-foreground",
              )}
            >
              {s.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text className="mb-2 text-[13px] font-semibold text-foreground">
        Description
      </Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        className="mb-6 min-h-[100px] rounded-[10px] border border-border bg-card px-4 py-3 text-[15px] text-foreground"
      />

      <Pressable
        onPress={handleSave}
        disabled={loading}
        className="items-center rounded-[10px] bg-primary py-4 active:opacity-90"
      >
        <Text className="text-[17px] font-bold text-primary-foreground">
          {loading ? "Saving…" : "Save Changes"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
