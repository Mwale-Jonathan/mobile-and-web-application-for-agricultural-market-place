import { getAvailabilityLabel } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import type { AvailabilityStatus } from "@/types";
import React from "react";
import { Text, View } from "react-native";

const STATUS_CONFIG: Record<
  string,
  { container: string; text: string; dot: string }
> = {
  available: {
    container: "bg-primary/10",
    text: "text-primary",
    dot: "bg-primary",
  },
  limited: {
    container: "bg-accent/15",
    text: "text-accent",
    dot: "bg-accent",
  },
  sold_out: {
    container: "bg-destructive/10",
    text: "text-destructive",
    dot: "bg-destructive",
  },
  hidden: {
    container: "bg-muted",
    text: "text-muted-foreground",
    dot: "bg-muted-foreground",
  },
};

interface AvailabilityBadgeProps {
  status: AvailabilityStatus;
  size?: "sm" | "md";
}

export function AvailabilityBadge({
  status,
  size = "md",
}: AvailabilityBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.available;
  const isSmall = size === "sm";

  return (
    <View
      className={cn(
        "flex-row items-center gap-1.5 self-start rounded-full",
        isSmall ? "px-2 py-0.5" : "px-3 py-1",
        config.container,
      )}
    >
      <View
        className={cn(
          isSmall ? "size-1.5" : "size-2",
          "rounded-full",
          config.dot,
        )}
      />
      <Text
        className={cn(
          isSmall ? "text-[11px]" : "text-[13px]",
          "font-semibold",
          config.text,
        )}
      >
        {getAvailabilityLabel(status)}
      </Text>
    </View>
  );
}
