import React from 'react';
import { View, Pressable } from 'react-native';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  onPress?: () => void;
  elevated?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onPress,
  elevated = true,
}) => {
  const baseStyles = 'bg-white rounded-2xl p-4 border border-gray-100';
  const elevationStyles = elevated ? 'shadow-sm' : '';

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        className={`${baseStyles} ${elevationStyles} active:opacity-90 ${className}`}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View className={`${baseStyles} ${elevationStyles} ${className}`}>
      {children}
    </View>
  );
};

export default Card;
