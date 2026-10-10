import React from 'react';
import { Text, TextInput, type TextInputProps, View } from 'react-native';
import { Colors } from '@/constants';
import { cn } from '@/lib/utils';

interface FormFieldProps extends TextInputProps {
  label: string;
  required?: boolean;
  containerClassName?: string;
}

export function FormField({
  label,
  required,
  containerClassName,
  className,
  ...inputProps
}: FormFieldProps) {
  return (
    <View className={containerClassName}>
      <Text className="mb-2 text-[13px] font-semibold text-foreground">
        {label}
        {required && <Text className="text-destructive"> *</Text>}
      </Text>
      <TextInput
        placeholderTextColor={Colors.textTertiary}
        className={cn(
          'rounded-[10px] border border-border bg-card px-4 py-3 text-[15px] text-foreground',
          className,
        )}
        {...inputProps}
      />
    </View>
  );
}
