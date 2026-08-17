import React from "react";
import { Text, ScrollView, Pressable } from "react-native";
import type { Category } from "@/types";
import { cn } from "@/lib/utils";

interface CategoryChipsProps {
  categories: Category[];
  selected: string | null;
  onSelect: (id: string | null) => void;
}

export function CategoryChips({
  categories,
  selected,
  onSelect,
}: CategoryChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-2 px-4"
    >
      <Pressable
        onPress={() => onSelect(null)}
        className={cn(
          "flex-row items-center rounded-full border px-4 py-2",
          !selected ? "border-primary bg-primary" : "border-border bg-card"
        )}
      >
        <Text
          className={cn(
            "text-[13px] font-semibold",
            !selected ? "text-primary-foreground" : "text-foreground"
          )}
        >
          All
        </Text>
      </Pressable>
      {categories.map((cat) => {
        const isActive = selected === cat.id;
        return (
          <Pressable
            key={cat.id}
            onPress={() => onSelect(isActive ? null : cat.id)}
            className={cn(
              "flex-row items-center gap-1.5 rounded-full border px-4 py-2",
              isActive ? "border-primary bg-primary" : "border-border bg-card"
            )}
          >
            <Text className="text-base">{cat.icon}</Text>
            <Text
              className={cn(
                "text-[13px] font-semibold",
                isActive ? "text-primary-foreground" : "text-foreground"
              )}
            >
              {cat.name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
