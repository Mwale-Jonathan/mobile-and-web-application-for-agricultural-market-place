import Ionicons from "@expo/vector-icons/Ionicons";
import type { ComponentProps } from "react";

export type AppIconName = ComponentProps<typeof Ionicons>["name"];

type AppIconProps = {
  name: AppIconName;
  size?: number;
  color?: string;
  style?: ComponentProps<typeof Ionicons>["style"];
};

export function AppIcon({
  name,
  size = 20,
  color = "#111827",
  style,
}: AppIconProps) {
  return <Ionicons name={name} size={size} color={color} style={style} />;
}
