import { AppIcon } from "@/components/app-icon";
import { getCallUrl, getWhatsAppUrl } from "@/lib/helpers";
import React from "react";
import { Alert, Linking, Pressable, Text, View } from "react-native";

interface ContactButtonsProps {
  phone: string;
  productName?: string;
  compact?: boolean;
}

export function ContactButtons({
  phone,
  productName,
  compact = false,
}: ContactButtonsProps) {
  const handleCall = () => {
    Linking.openURL(getCallUrl(phone)).catch(() =>
      Alert.alert("Error", "Could not open phone dialer"),
    );
  };

  const handleWhatsApp = () => {
    const message = productName
      ? `Hi, I'm interested in your ${productName} listed on AgriMart.`
      : "Hi, I found your listing on AgriMart.";
    Linking.openURL(getWhatsAppUrl(phone, message)).catch(() =>
      Alert.alert("Error", "Could not open WhatsApp"),
    );
  };

  if (compact) {
    return (
      <View className="flex-row gap-2">
        <Pressable
          onPress={handleCall}
          className="size-11 items-center justify-center rounded-full bg-primary/10"
        >
          <AppIcon name="call-outline" size={22} color="#16A34A" />
        </Pressable>
        <Pressable
          onPress={handleWhatsApp}
          className="size-11 items-center justify-center rounded-full bg-primary/15"
        >
          <AppIcon
            name="chatbubble-ellipses-outline"
            size={22}
            color="#16A34A"
          />
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-row gap-3">
      <Pressable
        onPress={handleCall}
        className="flex-1 flex-row items-center justify-center gap-2 rounded-[10px] bg-secondary border border-border py-3 active:opacity-90"
      >
        <AppIcon name="call-outline" size={19} color="#333" />
        <Text className="text-[15px] font-semibold text-foreground">Call</Text>
      </Pressable>
      <Pressable
        onPress={handleWhatsApp}
        className="flex-1 flex-row items-center justify-center gap-2 rounded-[10px] bg-primary py-3 active:opacity-90"
      >
        <AppIcon name="chatbubble-ellipses-outline" size={19} color="#FFFFFF" />
        <Text className="text-[15px] font-semibold text-primary-foreground">
          WhatsApp
        </Text>
      </Pressable>
    </View>
  );
}
