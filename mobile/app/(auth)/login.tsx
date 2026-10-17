import { AppLogoIcon } from "@/components/logo-icon";
import { AppButton, FormField } from "@/components/ui";
import { AppContext } from "@/context/app-context";
import { Link, router } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";

export default function LoginScreen() {
    const { login } = React.use(AppContext);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!username.trim()) {
            Alert.alert("Error", "Please enter your username or email");
            return;
        }
        if (!password) {
            Alert.alert("Error", "Please enter your password");
            return;
        }
        setLoading(true);
        try {
            await login(username.trim(), password);
            router.replace("/(tabs)/(home)");
        } catch (error) {
            Alert.alert(
                "Error",
                error instanceof Error ? error.message : "Unable to log in.",
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView
            className="flex-1 bg-muted"
            contentContainerClassName="grow"
            keyboardShouldPersistTaps="handled"
        >
            <View className="flex-1 justify-center px-6 py-15">
                {/* Logo */}
                <View className="mb-10 items-center">
                    <View className="mb-6 size-18 items-center justify-center rounded-[20px]">
                        <AppLogoIcon size={120} />
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
                    <FormField
                        label="Username or email"
                        value={username}
                        onChangeText={setUsername}
                        placeholder="Enter your username or email"
                        autoCapitalize="none"
                        required
                    />

                    <FormField
                        label="Password"
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Enter your password"
                        secureTextEntry
                        required
                    />

                    <AppButton
                        label="Log In"
                        onPress={handleLogin}
                        loading={loading}
                        className="mt-2"
                    />

                    <Link href="/(auth)/register" asChild>
                        <Pressable className="items-center py-3">
                            <Text className="text-[15px] text-muted-foreground">
                                Don&apos;t have an account?{" "}
                                <Text className="font-semibold text-primary">
                                    Register
                                </Text>
                            </Text>
                        </Pressable>
                    </Link>
                </View>

            </View>
        </ScrollView>
    );
}
