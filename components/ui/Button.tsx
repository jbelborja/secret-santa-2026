import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  View,
} from 'react-native';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  className = '',
}) => {
  const isDisabled = disabled || loading;

  const getVariantContainerStyles = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-[#15803D] active:opacity-80';
      case 'outline':
        return 'bg-transparent border border-[#B91C1C] active:opacity-70';
      case 'ghost':
        return 'bg-transparent active:opacity-60';
      case 'danger':
        return 'bg-red-600 active:opacity-80';
      case 'primary':
      default:
        return 'bg-[#B91C1C] active:opacity-80';
    }
  };

  const getVariantTextStyles = () => {
    switch (variant) {
      case 'outline':
      case 'ghost':
        return 'text-[#B91C1C] font-semibold';
      case 'secondary':
      case 'danger':
      case 'primary':
      default:
        return 'text-white font-semibold';
    }
  };

  const getSizeContainerStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-3.5 py-2 rounded-lg';
      case 'lg':
        return 'px-6 py-3.5 rounded-xl';
      case 'md':
      default:
        return 'px-4 py-2.5 rounded-xl';
    }
  };

  const getSizeTextStyles = () => {
    switch (size) {
      case 'sm':
        return 'text-sm';
      case 'lg':
        return 'text-base';
      case 'md':
      default:
        return 'text-sm';
    }
  };

  const getSpinnerColor = () => {
    if (variant === 'outline' || variant === 'ghost') {
      return '#B91C1C';
    }
    return '#FFFFFF';
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`flex-row items-center justify-center ${getVariantContainerStyles()} ${getSizeContainerStyles()} ${
        isDisabled ? 'opacity-40' : 'opacity-100'
      } ${className}`}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getSpinnerColor()} />
      ) : (
        <View className="flex-row items-center justify-center">
          {leftIcon ? <View className="mr-2">{leftIcon}</View> : null}
          <Text className={`text-center ${getVariantTextStyles()} ${getSizeTextStyles()}`}>
            {title}
          </Text>
          {rightIcon ? <View className="ml-2">{rightIcon}</View> : null}
        </View>
      )}
    </Pressable>
  );
};

export default Button;
