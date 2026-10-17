import React from "react";
import { Redirect } from "expo-router";
import { AppContext } from "@/context/app-context";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const { isLoggedIn, isInitializing } = React.use(AppContext);

  if (isInitializing) {
    return (
      <View className="flex-1 items-center justify-center bg-muted">
        <ActivityIndicator size="large" color="#16A34A" />
      </View>
    );
  }

  if (isLoggedIn) {
    return <Redirect href="/(tabs)/(home)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
