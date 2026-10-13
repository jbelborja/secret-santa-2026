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
      className={`items-center justify-center p-8 bg-gray-50 rounded-2xl border border-gray-200 my-2 ${className}`}
    >
      <View className="w-14 h-14 rounded-2xl bg-white items-center justify-center mb-4 border border-gray-200 shadow-sm">
        <Ionicons
          name={icon as keyof typeof Ionicons.glyphMap}
          size={26}
          color="#9CA3AF"
        />
      </View>

      <Text className="text-base font-semibold text-gray-800 text-center mb-1">
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
