import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

export interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'large';
  color?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message,
  size = 'large',
  color = '#B91C1C',
  className = '',
}) => {
  return (
    <View className={`flex-1 items-center justify-center p-6 ${className}`}>
      <ActivityIndicator size={size} color={color} />
      {message ? (
        <Text className="mt-3 text-sm text-gray-500 text-center">
          {message}
        </Text>
      ) : null}
    </View>
  );
};

export default LoadingSpinner;
