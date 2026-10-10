import React from 'react';
import { Text, View } from 'react-native';
import { getInitials } from '@/lib/helpers';
import { cn } from '@/lib/utils';

interface AvatarInitialsProps {
  name: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizes = {
  sm: { container: 'size-9', text: 'text-[13px]' },
  md: { container: 'size-12', text: 'text-lg' },
  lg: { container: 'size-[72px]', text: 'text-2xl' },
  xl: { container: 'size-20', text: 'text-[32px]' },
};

export function AvatarInitials({
  name,
  color = '#16A34A',
  size = 'md',
  className,
}: AvatarInitialsProps) {
  const { container, text } = sizes[size];
  return (
    <View
      className={cn('items-center justify-center rounded-full', container, className)}
      style={{ backgroundColor: color }}
    >
      <Text className={cn('font-extrabold text-primary-foreground', text)}>
        {getInitials(name)}
      </Text>
    </View>
  );
}
