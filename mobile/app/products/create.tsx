import React, { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
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
import { AppButton, FormField } from "@/components/ui";
import { AppContext } from "@/context/app-context";
import { Colors } from "@/constants";
import { CATEGORIES } from "@/data/mock-data";
import type { ProductUnit, AvailabilityStatus } from "@/types";
import type { UploadAsset } from "@/lib/api";
import { toUploadAsset } from "@/lib/image-upload";
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
  const [image, setImage] = useState<UploadAsset | null>(null);
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async () => {
    if (!name.trim() || !categoryId || !price || !quantity) {
      Alert.alert(
        "Error",
        "Please fill in all required fields (name, category, price, quantity)",
      );
      return;
    }
    setLoading(true);
    try {
      await addProduct({
        name: name.trim(),
        categoryId,
        price: parseFloat(price),
        unit,
        quantity: parseInt(quantity, 10),
        description: description.trim(),
        location: location.trim() || currentUser?.location || "Lusaka",
        province: currentUser?.province || "Lusaka",
        latitude: currentUser?.latitude ?? null,
        longitude: currentUser?.longitude ?? null,
        availability: "available" as AvailabilityStatus,
      }, image);
      Alert.alert("Success", "Product listed successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert("Unable to list product", error instanceof Error ? error.message : "Please try again.");
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
      {/* Image placeholder */}
      <Pressable onPress={pickImage} className="mb-5 h-40 overflow-hidden items-center justify-center rounded-[14px] border-2 border-dashed border-border bg-muted">
        {image ? (
          <Image source={{ uri: image.uri }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
        ) : (
          <>
            <AppIcon name="camera-outline" size={42} color="#6B7280" style={{ marginBottom: 8 }} />
            <Text className="text-[15px] font-semibold text-muted-foreground">Add Product Photo</Text>
            <Text className="mt-1 text-[11px] text-muted-foreground">JPEG, PNG or WebP up to 5MB</Text>
          </>
        )}
      </Pressable>

      {/* Product Name */}
      <FormField
        label="Product Name"
        value={name}
        onChangeText={setName}
        placeholder="e.g. White Maize, Tomatoes"
        required
        containerClassName="mb-4"
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
      <FormField
        label="Location"
        value={location}
        onChangeText={setLocation}
        placeholder="e.g. Chongwe, Kafue"
        containerClassName="mb-6"
      />

      {/* Submit */}
      <AppButton label="List Product" onPress={handleSubmit} loading={loading} />
    </ScrollView>
  );
}
