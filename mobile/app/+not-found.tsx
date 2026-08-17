import React from "react";
import { View, Text, Pressable } from "react-native";
import { Link } from "expo-router";
import { AppIcon } from "@/components/app-icon";

export default function NotFoundScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-muted p-6">
      <AppIcon
        name="leaf-outline"
        size={66}
        color="#16A34A"
        style={{ marginBottom: 16 }}
      />
      <Text className="text-2xl font-extrabold text-foreground">
        Page Not Found
      </Text>
      <Text className="mt-2 text-center text-[15px] text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist.
      </Text>
      <Link href="/" asChild>
        <Pressable className="mt-6 rounded-[10px] bg-primary px-6 py-3 active:opacity-90">
          <Text className="text-[15px] font-semibold text-primary-foreground">
            Go Home
          </Text>
        </Pressable>
      </Link>
    </View>
  );
}
