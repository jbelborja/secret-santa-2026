import React from 'react';
import { View, Text } from 'react-native';

export interface BadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return { container: 'bg-emerald-50 border border-emerald-200', text: 'text-emerald-700' };
      case 'warning':
        return { container: 'bg-amber-50 border border-amber-200', text: 'text-amber-700' };
      case 'error':
        return { container: 'bg-red-50 border border-red-200', text: 'text-red-700' };
      case 'info':
        return { container: 'bg-sky-50 border border-sky-200', text: 'text-sky-700' };
      case 'primary':
        return { container: 'bg-red-50 border border-red-200', text: 'text-[#B91C1C]' };
      case 'default':
      default:
        return { container: 'bg-gray-100 border border-gray-200', text: 'text-gray-600' };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { container: 'px-2 py-0.5 rounded-full', text: 'text-xs font-medium' };
      case 'md':
      default:
        return { container: 'px-2.5 py-0.5 rounded-full', text: 'text-xs font-semibold' };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <View
      className={`self-start items-center justify-center ${variantStyles.container} ${sizeStyles.container} ${className}`}
    >
      <Text className={`${variantStyles.text} ${sizeStyles.text}`}>
        {label}
      </Text>
    </View>
  );
};

export default Badge;
