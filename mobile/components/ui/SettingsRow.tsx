import React from 'react';
import { Pressable, Text } from 'react-native';
import { AppIcon, type AppIconName } from '@/components/app-icon';
import { cn } from '@/lib/utils';
import { Colors } from '@/constants';

interface SettingsRowProps {
  icon: AppIconName;
  label: string;
  onPress: () => void;
  borderBottom?: boolean;
  destructive?: boolean;
}

export function SettingsRow({
  icon,
  label,
  onPress,
  borderBottom = true,
  destructive = false,
}: SettingsRowProps) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'flex-row items-center gap-3 px-4 py-4 active:bg-muted',
        borderBottom && 'border-b border-border',
      )}
    >
      <AppIcon
        name={icon}
        size={22}
        color={destructive ? Colors.danger : Colors.primary}
      />
      <Text
        className={cn(
          'flex-1 text-[15px]',
          destructive ? 'text-destructive font-medium' : 'text-foreground',
        )}
      >
        {label}
      </Text>
      {!destructive && (
        <AppIcon name="arrow-forward" size={16} color="#6B7280" />
      )}
    </Pressable>
  );
}
