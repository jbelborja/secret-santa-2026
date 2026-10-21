import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  NativeSyntheticEvent,
  TextInputFocusEventData,
} from 'react-native';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  className = '',
  onFocus,
  onBlur,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const getBorderColor = () => {
    if (error) return 'border-red-400 bg-red-50/30';
    if (isFocused) return 'border-[#B91C1C] bg-white';
    return 'border-gray-200 bg-gray-50';
  };

  return (
    <View className={`w-full mb-3 ${className}`}>
      {label ? (
        <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          {label}
        </Text>
      ) : null}

      <View
        className={`flex-row items-center border rounded-xl px-3.5 py-3 ${getBorderColor()}`}
      >
        {leftIcon ? <View className="mr-2.5">{leftIcon}</View> : null}

        <TextInput
          className="flex-1 text-gray-900 text-sm p-0"
          placeholderTextColor="#9CA3AF"
          underlineColorAndroid="transparent"
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...textInputProps}
        />

        {rightIcon ? <View className="ml-2.5">{rightIcon}</View> : null}
      </View>

      {error ? (
        <Text className="text-xs text-red-600 mt-1 ml-0.5 font-medium">
          {error}
        </Text>
      ) : null}
    </View>
  );
};

export default Input;
