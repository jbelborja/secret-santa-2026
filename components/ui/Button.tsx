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
        return 'bg-[#15803D] active:bg-[#166534]';
      case 'outline':
        return 'bg-transparent border-2 border-[#B91C1C] active:bg-red-50';
      case 'ghost':
        return 'bg-transparent active:bg-red-50/50';
      case 'danger':
        return 'bg-red-600 active:bg-red-700';
      case 'primary':
      default:
        return 'bg-[#B91C1C] active:bg-[#991B1B]';
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
        return 'px-3 py-1.5 rounded-lg';
      case 'lg':
        return 'px-6 py-4 rounded-2xl';
      case 'md':
      default:
        return 'px-4 py-3 rounded-xl';
    }
  };

  const getSizeTextStyles = () => {
    switch (size) {
      case 'sm':
        return 'text-xs';
      case 'lg':
        return 'text-lg';
      case 'md':
      default:
        return 'text-base';
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
      className={`flex-row items-center justify-center shadow-sm ${getVariantContainerStyles()} ${getSizeContainerStyles()} ${
        isDisabled ? 'opacity-50' : 'opacity-100'
      } ${className}`}
    >
      {loading ? (
        <View className="flex-row items-center justify-center py-0.5">
          <ActivityIndicator size={size === 'lg' ? 'small' : 'small'} color={getSpinnerColor()} />
          <Text className={`ml-2 ${getVariantTextStyles()} ${getSizeTextStyles()}`}>
            Loading...
          </Text>
        </View>
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
