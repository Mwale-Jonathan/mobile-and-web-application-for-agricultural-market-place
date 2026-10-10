import React from 'react';
import { Text } from 'react-native';
import { cn } from '@/lib/utils';

export function SectionHeader({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <Text
      className={cn(
        'mb-2 ml-1 text-[13px] font-semibold uppercase tracking-[0.5px] text-muted-foreground',
        className,
      )}
    >
      {label}
    </Text>
  );
}
