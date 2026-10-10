import { AppIcon, type AppIconName } from "@/components/app-icon";
import {
  AppButton,
  AvatarInitials,
  SectionHeader,
  SettingsRow,
} from "@/components/ui";
import { Colors } from "@/constants";
import { AppContext } from "@/context/app-context";
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
    {
      icon: "person-outline",
      label: "Edit Profile",
      action: () => router.push("/profile/edit"),
    },
    {
      icon: "lock-closed-outline",
      label: "Change Password",
      action: () => router.push("/profile/change-password"),
    },
    {
      icon: "location-outline",
      label: "Manage Location",
      action: () => router.push("/profile/manage-location"),
    },
    {
      icon: "notifications-outline",
      label: "Notifications",
      action: () => {
        Alert.alert("Notifications", "You have no new notifications.");
      },
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
        <View className="mb-3">
          <AvatarInitials
            name={currentUser?.name || "U"}
            color={currentUser?.avatarColor || Colors.primary}
            size="lg"
          />
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
        <SectionHeader label="Simulation" />
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
        <SectionHeader label="Account" />
        <View className="mb-6 overflow-hidden rounded-[14px] border border-border bg-card">
          {accountItems.map((item, i) => (
            <SettingsRow
              key={item.label}
              icon={item.icon}
              label={item.label}
              onPress={item.action}
              borderBottom={i < accountItems.length - 1}
            />
          ))}
        </View>

        {/* Quick Links */}
        <SectionHeader label="Quick Links" />
        <View className="mb-6 overflow-hidden rounded-[14px] border border-border bg-card">
          {quickLinks.map((item, i) => (
            <SettingsRow
              key={item.label}
              icon={item.icon}
              label={item.label}
              onPress={item.action}
              borderBottom={i < quickLinks.length - 1}
            />
          ))}
        </View>

        {/* Logout */}
        <AppButton
          label="Log Out"
          onPress={handleLogout}
          variant="destructive"
        />

        {/* App version */}
        <Text className="mt-6 text-center text-[11px] text-muted-foreground">
          AgriMart v1.0.0 - Expo SDK 54
        </Text>
      </View>
    </ScrollView>
  );
}
