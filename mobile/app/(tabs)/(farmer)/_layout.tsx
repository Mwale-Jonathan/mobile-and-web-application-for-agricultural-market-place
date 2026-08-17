import React from "react";
import { Stack } from "expo-router";

export default function FarmerLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "My Farm", headerLargeTitle: true }} />
    </Stack>
  );
}
