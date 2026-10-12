import React from 'react';
import { View, Text } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: string; // Ionicons name
  title: string;
  subtitle?: string;
  action?: { label: string; onPress: () => void };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'gift-outline',
  title,
  subtitle,
  action,
  className = '',
}) => {
  return (
    <View
      className={`items-center justify-center p-8 bg-white/60 rounded-3xl border border-dashed border-gray-200 my-4 ${className}`}
    >
      <View className="w-16 h-16 rounded-full bg-red-50 items-center justify-center mb-4 border border-red-100">
        <Ionicons
          name={icon as keyof typeof Ionicons.glyphMap}
          size={32}
          color="#B91C1C"
        />
      </View>

      <Text className="text-lg font-bold text-gray-900 text-center mb-1">
        {title}
      </Text>

      {subtitle ? (
        <Text className="text-sm text-gray-500 text-center max-w-xs mb-5 leading-5">
          {subtitle}
        </Text>
      ) : null}

      {action ? (
        <Button
          title={action.label}
          onPress={action.onPress}
          size="md"
          variant="primary"
          className="min-w-[160px]"
        />
      ) : null}
    </View>
  );
};

export default EmptyState;
