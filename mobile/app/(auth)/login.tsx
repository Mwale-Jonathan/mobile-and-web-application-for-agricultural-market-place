import { AppIcon } from "@/components/app-icon";
import { AppLogoIcon } from "@/components/logo-icon";
import { Colors } from "@/constants";
import { AppContext } from "@/context/app-context";
import { Link, router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

export default function LoginScreen() {
  const { login, loginAs } = React.use(AppContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email");
      return;
    }
    const success = login(email.trim(), password);
    if (success) {
      router.replace("/(tabs)/(home)");
    } else {
      Alert.alert("Error", "Account not found. Try a demo account below.");
    }
  };

  const handleDemoLogin = (userId: string) => {
    loginAs(userId);
    router.replace("/(tabs)/(home)");
  };

  return (
    <ScrollView
      className="flex-1 bg-muted"
      contentContainerClassName="grow"
      keyboardShouldPersistTaps="handled"
    >
      <View className="flex-1 justify-center px-6 py-[60px]">
        {/* Logo */}
        <View className="mb-10 items-center">
          <View className="mb-4 size-[72px] items-center justify-center rounded-[20px]">
            <AppLogoIcon size={72} />
          </View>
          <Text className="text-[32px] font-extrabold text-foreground">
            AgriMart
          </Text>
          <Text className="mt-1 text-[15px] text-muted-foreground">
            Zambia&apos;s Agricultural Marketplace
          </Text>
        </View>

        {/* Form */}
        <View className="gap-4">
          <View>
            <Text className="mb-2 text-[13px] font-semibold text-foreground">
              Email
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor={Colors.textTertiary}
              keyboardType="email-address"
              autoCapitalize="none"
              className="rounded-[10px] border border-border bg-card px-4 py-3 text-[15px] text-foreground"
            />
          </View>

          <View>
            <Text className="mb-2 text-[13px] font-semibold text-foreground">
              Password
            </Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor={Colors.textTertiary}
              secureTextEntry
              className="rounded-[10px] border border-border bg-card px-4 py-3 text-[15px] text-foreground"
            />
          </View>

          <Pressable
            onPress={handleLogin}
            className="mt-2 items-center rounded-[10px] bg-primary py-4 active:opacity-90"
          >
            <Text className="text-[17px] font-bold text-primary-foreground">
              Log In
            </Text>
          </Pressable>

          <Link href="/(auth)/register" asChild>
            <Pressable className="items-center py-3">
              <Text className="text-[15px] text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Text className="font-semibold text-primary">Register</Text>
              </Text>
            </Pressable>
          </Link>
        </View>

        {/* Demo Accounts */}
        <View className="mt-10 border-t border-border pt-6">
          <Text className="mb-4 text-center text-[13px] font-semibold text-muted-foreground">
            Quick Demo Access
          </Text>

          <View className="gap-2">
            <Pressable
              onPress={() => handleDemoLogin("farmer-1")}
              className="flex-row items-center gap-3 rounded-[10px] border border-border bg-card px-4 py-3 active:bg-primary/10"
            >
              <AppIcon name="storefront-outline" size={28} color="#16A34A" />
              <View className="flex-1">
                <Text className="text-[15px] font-semibold text-foreground">
                  Login as Farmer
                </Text>
                <Text className="text-[13px] text-muted-foreground">
                  Mwansa Chanda - Chongwe
                </Text>
              </View>
              <View className="flex-row items-center gap-1">
                <Text className="text-[11px] font-semibold text-primary">
                  LOGIN
                </Text>
                <AppIcon name="arrow-forward" size={12} color="#16A34A" />
              </View>
            </Pressable>

            <Pressable
              onPress={() => handleDemoLogin("consumer-1")}
              className="flex-row items-center gap-3 rounded-[10px] border border-border bg-card px-4 py-3 active:bg-primary/10"
            >
              <AppIcon name="basket-outline" size={28} color="#16A34A" />
              <View className="flex-1">
                <Text className="text-[15px] font-semibold text-foreground">
                  Login as Buyer
                </Text>
                <Text className="text-[13px] text-muted-foreground">
                  Joseph Phiri - Lusaka CBD
                </Text>
              </View>
              <View className="flex-row items-center gap-1">
                <Text className="text-[11px] font-semibold text-primary">
                  LOGIN
                </Text>
                <AppIcon name="arrow-forward" size={12} color="#16A34A" />
              </View>
            </Pressable>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
