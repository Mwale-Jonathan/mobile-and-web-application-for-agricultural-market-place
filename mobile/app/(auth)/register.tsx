import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
} from "react-native";
import { Link, router } from "expo-router";
import { AppIcon } from "@/components/app-icon";
import { AppContext } from "@/context/app-context";
import type { UserRole } from "@/types";
import { cn } from "@/lib/utils";
import { AppButton, FormField } from "@/components/ui";
import { LocationPickerModal, type LocationResult } from "@/components/LocationPickerModal";

export default function RegisterScreen() {
  const { register } = React.use(AppContext);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("consumer");
  const [location, setLocation] = useState("");
  const [province, setProvince] = useState("Lusaka");
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [pickerVisible, setPickerVisible] = useState(false);

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
      province: province || "Lusaka",
      latitude,
      longitude,
    });
    router.replace("/(tabs)/(home)");
  };

  const handleLocationPicked = (result: LocationResult) => {
    setLocation(result.locationName);
    setProvince(result.province);
    setLatitude(result.latitude);
    setLongitude(result.longitude);
    setPickerVisible(false);
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
          <FormField
            label="Full Name"
            value={name}
            onChangeText={setName}
            placeholder="Enter your full name"
            required
          />

          <FormField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            required
          />

          <FormField
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            placeholder="+260..."
            keyboardType="phone-pad"
            required
          />

          {/* Location with Map Picker */}
          <View>
            <Text className="mb-2 text-[13px] font-semibold text-foreground">
              Location
            </Text>
            <Pressable
              onPress={() => setPickerVisible(true)}
              className="flex-row items-center gap-3 rounded-[10px] border border-border bg-card px-4 py-3.5 active:bg-muted"
            >
              <AppIcon name="location-outline" size={20} color="#16A34A" />
              <View className="flex-1">
                <Text
                  className={cn(
                    "text-[15px]",
                    location ? "text-foreground font-medium" : "text-muted-foreground",
                  )}
                >
                  {location ? `${location}, ${province}` : "Find your place on map..."}
                </Text>
                {latitude && longitude && (
                  <Text className="text-[11px] text-muted-foreground mt-0.5">
                    {latitude.toFixed(4)}, {longitude.toFixed(4)}
                  </Text>
                )}
              </View>
              <AppIcon name="map-outline" size={18} color="#6B7280" />
            </Pressable>
          </View>

          <FormField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Create a password"
            secureTextEntry
            required
          />

          <AppButton
            label="Create Account"
            onPress={handleRegister}
            className="mt-2"
          />

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

      <LocationPickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onConfirm={handleLocationPicked}
        initialLatitude={latitude}
        initialLongitude={longitude}
      />
    </ScrollView>
  );
}
