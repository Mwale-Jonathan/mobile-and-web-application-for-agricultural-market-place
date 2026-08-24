import { AppIcon, type AppIconName } from "@/components/app-icon";
import { AppContext } from "@/context/app-context";
import { cn } from "@/lib/utils";
import { Tabs } from "expo-router";
import React from "react";
import { Text, View } from "react-native";

function TabIcon({
  name,
  focused,
}: {
  name: AppIconName;
  focused: boolean;
}) {
  return (
    <View className="items-center justify-center">
      <AppIcon
        name={name}
        size={23}
        color={focused ? "#16A34A" : "#6B7280"}
        style={{ opacity: focused ? 1 : 0.68 }}
      />
    </View>
  );
}

export default function TabLayout() {
  const { currentUser } = React.use(AppContext);
  const isFarmer = currentUser?.role === "farmer";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        // 1. Style the Label using NativeWind classes instead of tabBarLabelStyle
        tabBarLabel: ({ focused, children }) => (
          <Text
            className={cn(
              "pb-1 text-xs font-semibold",
              focused ? "text-primary" : "text-muted-foreground",
            )}
          >
            {children}
          </Text>
        ),

        // 2. Style the TabBar background & borders using NativeWind instead of tabBarStyle
        tabBarBackground: () => (
          <View className="absolute inset-0 border-t border-border bg-card" />
        ),

        // 3. Optional layout adjustment: hides default background/borders so your custom background renders perfectly
        tabBarStyle: {
          borderTopWidth: 0,
          elevation: 0,
        },
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="home-outline" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="(products)"
        options={{
          title: "Products",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="basket-outline" focused={focused} />
          ),
          href: isFarmer ? null : "/(tabs)/(products)",
        }}
      />
      <Tabs.Screen
        name="(farmer)"
        options={{
          title: "My Farm",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="storefront-outline" focused={focused} />
          ),
          href: isFarmer ? "/(tabs)/(farmer)" : null,
        }}
      />
      <Tabs.Screen
        name="(map)"
        options={{
          title: "Nearby",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="location-outline" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="(settings)"
        options={{
          title: "Settings",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="settings-outline" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
