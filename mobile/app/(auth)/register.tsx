import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
} from "react-native";
import { Link, router } from "expo-router";
import { AppIcon } from "@/components/app-icon";
import { AppContext } from "@/context/app-context";
import { Colors } from "@/constants";
import type { UserRole } from "@/types";
import { cn } from "@/lib/utils";

export default function RegisterScreen() {
  const { register } = React.use(AppContext);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("consumer");
  const [location, setLocation] = useState("");

  const handleRegister = () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }
    register({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      role,
      location: location.trim() || "Lusaka",
      province: "Lusaka",
    });
    router.replace("/(tabs)/(home)");
  };

  return (
    <ScrollView
      className="flex-1 bg-muted"
      contentContainerClassName="grow py-[60px]"
      keyboardShouldPersistTaps="handled"
    >
      <View className="px-6">
        {/* Header */}
        <View className="mb-8 items-center">
          <Text className="text-2xl font-extrabold text-foreground">
            Create Account
          </Text>
          <Text className="mt-1 text-[15px] text-muted-foreground">
            Join AgriMart today
          </Text>
        </View>

        {/* Role Selection */}
        <View className="mb-6">
          <Text className="mb-2 text-[13px] font-semibold text-foreground">
            I am a...
          </Text>
          <View className="flex-row gap-3">
            {(["consumer", "farmer"] as UserRole[]).map((r) => (
              <Pressable
                key={r}
                onPress={() => setRole(r)}
                className={cn(
                  "flex-1 items-center rounded-[10px] border-2 py-4",
                  role === r
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card",
                )}
              >
                <AppIcon
                  name={r === "farmer" ? "storefront-outline" : "basket-outline"}
                  size={34}
                  color={role === r ? "#16A34A" : "#111827"}
                  style={{ marginBottom: 8 }}
                />
                <Text
                  className={cn(
                    "text-[15px] font-semibold",
                    role === r ? "text-primary" : "text-foreground",
                  )}
                >
                  {r === "farmer" ? "Farmer / Supplier" : "Buyer / Consumer"}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Form fields */}
        <View className="gap-4">
          {[
            {
              label: "Full Name",
              value: name,
              set: setName,
              placeholder: "Enter your full name",
              type: "default" as const,
            },
            {
              label: "Email",
              value: email,
              set: setEmail,
              placeholder: "Enter your email",
              type: "email-address" as const,
            },
            {
              label: "Phone Number",
              value: phone,
              set: setPhone,
              placeholder: "+260...",
              type: "phone-pad" as const,
            },
            {
              label: "Location",
              value: location,
              set: setLocation,
              placeholder: "e.g. Lusaka, Chongwe, Kafue",
              type: "default" as const,
            },
            {
              label: "Password",
              value: password,
              set: setPassword,
              placeholder: "Create a password",
              type: "default" as const,
              secure: true,
            },
          ].map((field) => (
            <View key={field.label}>
              <Text className="mb-2 text-[13px] font-semibold text-foreground">
                {field.label}
              </Text>
              <TextInput
                value={field.value}
                onChangeText={field.set}
                placeholder={field.placeholder}
                placeholderTextColor={Colors.textTertiary}
                keyboardType={field.type}
                secureTextEntry={field.secure}
                autoCapitalize={
                  field.type === "email-address" ? "none" : "words"
                }
                className="rounded-[10px] border border-border bg-card px-4 py-3 text-[15px] text-foreground"
              />
            </View>
          ))}

          <Pressable
            onPress={handleRegister}
            className="mt-2 items-center rounded-[10px] bg-primary py-4 active:opacity-90"
          >
            <Text className="text-[17px] font-bold text-primary-foreground">
              Create Account
            </Text>
          </Pressable>

          <Link href="/(auth)/login" asChild>
            <Pressable className="items-center py-3">
              <Text className="text-[15px] text-muted-foreground">
                Already have an account?{" "}
                <Text className="font-semibold text-primary">Log In</Text>
              </Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
}
