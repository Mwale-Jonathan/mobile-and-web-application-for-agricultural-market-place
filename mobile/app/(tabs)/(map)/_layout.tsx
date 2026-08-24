import React from "react";
import { Stack } from "expo-router";

export default function MapLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ title: "Nearby Farms", headerLargeTitle: false }}
      />
    </Stack>
  );
}
