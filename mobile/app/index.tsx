import React from "react";
import { Redirect } from "expo-router";
import { AppContext } from "@/context/app-context";

export default function Index() {
  const { isLoggedIn } = React.use(AppContext);

  if (isLoggedIn) {
    return <Redirect href="/(tabs)/(home)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
