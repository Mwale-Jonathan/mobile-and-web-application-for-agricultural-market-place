import { AppIcon, type AppIconName } from "@/components/app-icon";
import { Colors } from "@/constants";
import { AppContext } from "@/context/app-context";
import { getInitials } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import { router } from "expo-router";
import React from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

type SettingsItem = {
  icon: AppIconName;
  label: string;
  action: () => void;
};

export default function SettingsScreen() {
  const { currentUser, switchRole, logout } = React.use(AppContext);

  const isFarmer = currentUser?.role === "farmer";

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => {
          logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const handleRoleSwitch = () => {
    const newRole = isFarmer ? "consumer" : "farmer";
    switchRole(newRole);
    Alert.alert(
      "Role Switched",
      `You are now using AgriMart as a ${
        newRole === "farmer" ? "Farmer/Supplier" : "Buyer/Consumer"
      }. Restart navigation to see updated tabs.`,
      [
        {
          text: "OK",
          onPress: () => router.replace("/(tabs)/(home)"),
        },
      ],
    );
  };

  const accountItems: SettingsItem[] = [
    { icon: "person-outline", label: "Edit Profile", action: () => {} },
    {
      icon: "lock-closed-outline",
      label: "Change Password",
      action: () => {},
    },
    {
      icon: "location-outline",
      label: "Manage Location",
      action: () => {},
    },
    {
      icon: "notifications-outline",
      label: "Notifications",
      action: () => {},
    },
  ];

  const quickLinks: SettingsItem[] = [
    {
      icon: "bookmark-outline",
      label: "Saved Products",
      action: () => router.push("/saved"),
    },
    {
      icon: "bar-chart-outline",
      label: "Price Comparison",
      action: () => router.push("/price-compare"),
    },
    {
      icon: "trending-up-outline",
      label: "Price Predictions",
      action: () => router.push("/predictions"),
    },
  ];

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      className="flex-1 bg-muted"
      contentContainerClassName="pb-10"
    >
      {/* Profile Card */}
      <View className="m-4 items-center rounded-[20px] bg-card p-6 shadow-md">
        <View
          className="mb-3 size-[72px] items-center justify-center rounded-full"
          style={{
            backgroundColor: currentUser?.avatarColor || Colors.primary,
          }}
        >
          <Text className="text-2xl font-extrabold text-primary-foreground">
            {getInitials(currentUser?.name || "U")}
          </Text>
        </View>
        <Text className="text-xl font-bold text-foreground">
          {currentUser?.name}
        </Text>
        <Text className="mt-1 text-[13px] text-muted-foreground">
          {currentUser?.email}
        </Text>
        <View className="mt-2 flex-row items-center gap-2">
          <AppIcon name="location-outline" size={15} color="#6B7280" />
          <Text className="text-[13px] text-muted-foreground">
            {currentUser?.location}, {currentUser?.province}
          </Text>
        </View>
        <View
          className={cn(
            "mt-3 rounded-full px-4 py-1",
            isFarmer ? "bg-primary/10" : "bg-secondary",
          )}
        >
          <View className="flex-row items-center gap-1.5">
            <AppIcon
              name={isFarmer ? "storefront-outline" : "basket-outline"}
              size={15}
              color={isFarmer ? "#16A34A" : "#111827"}
            />
            <Text
              className={cn(
                "text-[13px] font-bold",
                isFarmer ? "text-primary" : "text-secondary-foreground",
              )}
            >
              {isFarmer ? "Farmer / Supplier" : "Buyer / Consumer"}
            </Text>
          </View>
        </View>
      </View>

      {/* Role Switcher */}
      <View className="px-4">
        <Text className="mb-2 ml-1 text-[13px] font-semibold uppercase tracking-[0.5px] text-muted-foreground">
          Simulation
        </Text>
        <Pressable
          onPress={handleRoleSwitch}
          className="mb-6 flex-row items-center gap-3 rounded-[10px] border border-accent bg-accent/15 p-4 active:opacity-90"
        >
          <AppIcon name="sync-outline" size={30} color="#D97706" />
          <View className="flex-1">
            <Text className="text-[15px] font-bold text-foreground">
              Switch to {isFarmer ? "Buyer" : "Farmer"} Mode
            </Text>
            <Text className="mt-0.5 text-[13px] text-muted-foreground">
              Currently: {isFarmer ? "Farmer/Supplier" : "Buyer/Consumer"}
            </Text>
          </View>
          <AppIcon name="arrow-forward" size={17} color="#D97706" />
        </Pressable>
      </View>

      {/* Settings List */}
      <View className="px-4">
        <Text className="mb-2 ml-1 text-[13px] font-semibold uppercase tracking-[0.5px] text-muted-foreground">
          Account
        </Text>
        {/* Added will-change-variable here as a preventive measure */}
        <View className="will-change-variable mb-6 overflow-hidden rounded-[14px] border border-border bg-card">
          {accountItems.map((item, i) => (
            <Pressable
              key={item.label}
              onPress={item.action}
              className={cn(
                "flex-row items-center gap-3 px-4 py-4 active:bg-muted",
                i < accountItems.length - 1 && "border-b border-border",
              )}
            >
              <AppIcon name={item.icon} size={22} color="#16A34A" />
              <Text className="flex-1 text-[15px] text-foreground">
                {item.label}
              </Text>
              <AppIcon name="arrow-forward" size={16} color="#6B7280" />
            </Pressable>
          ))}
        </View>

        {/* Quick Links */}
        <Text className="mb-2 ml-1 text-[13px] font-semibold uppercase tracking-[0.5px] text-muted-foreground">
          Quick Links
        </Text>
        {/* FIX: Added 'will-change-variable' utility here */}
        <View className="will-change-variable mb-6 overflow-hidden rounded-[14px] border border-border bg-card">
          {quickLinks.map((item, i) => (
            <Pressable
              key={item.label}
              onPress={item.action}
              className={cn(
                "flex-row items-center gap-3 px-4 py-4 active:bg-muted",
                i < quickLinks.length - 1 && "border-b border-border",
              )}
            >
              <AppIcon name={item.icon} size={22} color="#16A34A" />
              <Text className="flex-1 text-[15px] text-foreground">
                {item.label}
              </Text>
              <AppIcon name="arrow-forward" size={16} color="#6B7280" />
            </Pressable>
          ))}
        </View>

        {/* Logout */}
        <Pressable
          onPress={handleLogout}
          className="items-center rounded-[10px] border border-destructive bg-transparent p-4 active:bg-destructive/10"
        >
          <Text className="text-[15px] font-bold text-destructive">
            Log Out
          </Text>
        </Pressable>

        {/* App version */}
        <Text className="mt-6 text-center text-[11px] text-muted-foreground">
          AgriMart v1.0.0 - Expo SDK 54
        </Text>
      </View>
    </ScrollView>
  );
}
