import React from "react";
import { View, Text, Pressable } from "react-native";
import { AppIcon, type AppIconName } from "@/components/app-icon";

interface EmptyStateProps {
  icon: AppIconName;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-[60px]">
      <View className="mb-4">
        <AppIcon name={icon} size={52} color="#16A34A" />
      </View>
      <Text className="mb-2 text-center text-xl font-bold text-foreground">
        {title}
      </Text>
      <Text className="text-center text-[15px] leading-[22px] text-muted-foreground">
        {message}
      </Text>
      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          className="mt-5 rounded-[10px] bg-primary px-6 py-3 active:opacity-90"
        >
          <Text className="text-[15px] font-semibold text-primary-foreground">
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

export function LoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <View className="flex-1 items-center justify-center py-[60px]">
      <View className="mb-3">
        <AppIcon name="hourglass-outline" size={32} color="#6B7280" />
      </View>
      <Text className="text-[15px] text-muted-foreground">{message}</Text>
    </View>
  );
}

export function ErrorState({
  message = "Something went wrong",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <EmptyState
      icon="warning-outline"
      title="Error"
      message={message}
      actionLabel={onRetry ? "Retry" : undefined}
      onAction={onRetry}
    />
  );
}
