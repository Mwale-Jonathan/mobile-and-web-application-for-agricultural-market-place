import React from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'outline' | 'destructive' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

export interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const variants: Record<Variant, string> = {
  primary: 'bg-primary',
  outline: 'border border-border bg-card',
  destructive: 'border border-destructive bg-transparent',
  ghost: 'bg-transparent',
};

const sizes: Record<Size, string> = {
  sm: 'px-4 py-2',
  md: 'px-5 py-3',
  lg: 'py-4',
};

const textVariants: Record<Variant, string> = {
  primary: 'text-primary-foreground',
  outline: 'text-foreground',
  destructive: 'text-destructive',
  ghost: 'text-foreground',
};

const textSizes: Record<Size, string> = {
  sm: 'text-[13px]',
  md: 'text-[15px]',
  lg: 'text-[17px]',
};

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  loading = false,
  disabled = false,
  className,
  children,
}: AppButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={cn(
        'items-center justify-center flex-row gap-2 rounded-[10px] active:opacity-90',
        variants[variant],
        sizes[size],
        className,
      )}
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? '#fff' : '#16A34A'}
        />
      )}
      {children}
      <Text
        className={cn(
          'font-bold',
          textVariants[variant],
          textSizes[size],
        )}
      >
        {label}
      </Text>
    </Pressable>
  );
}
