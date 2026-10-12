import React from 'react';
import { View, Text, Image } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Raffle } from '../../types';
import { Card } from '../ui/Card';
import { StatusBadge } from './StatusBadge';
import { Badge } from '../ui/Badge';

export interface RaffleCardProps {
  raffle: Raffle;
  onPress: () => void;
  isManager?: boolean;
  className?: string;
}

export const RaffleCard: React.FC<RaffleCardProps> = ({
  raffle,
  onPress,
  isManager = false,
  className = '',
}) => {
  const giftDate =
    raffle.giftDate instanceof Date ? raffle.giftDate : new Date(raffle.giftDate);

  const now = new Date();
  const diffDays = Math.ceil(
    (giftDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  const formattedGiftDate = giftDate.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Card
      onPress={onPress}
      elevated
      className={`overflow-hidden border border-red-100/60 p-0 mb-4 bg-white ${className}`}
    >
      {/* Decorative festive header bar or cover image */}
      {raffle.coverImageUrl ? (
        <View className="h-32 w-full relative">
          <Image
            source={{ uri: raffle.coverImageUrl }}
            className="w-full h-full"
            resizeMode="cover"
          />
          <View className="absolute inset-0 bg-black/20" />
        </View>
      ) : (
        <View className="h-16 w-full bg-gradient-to-r bg-[#B91C1C] flex-row items-center justify-between px-4 relative overflow-hidden">
          <View className="flex-row items-center space-x-2">
            <Text className="text-2xl mr-1">🎁</Text>
            <Text className="text-white font-bold text-sm tracking-wider uppercase">
              Secret Santa
            </Text>
          </View>
          {/* Snowflake decoration */}
          <Ionicons name="snow" size={28} color="rgba(255, 255, 255, 0.4)" />
        </View>
      )}

      {/* Main content body */}
      <View className="p-4">
        {/* Top badges row */}
        <View className="flex-row items-center justify-between mb-2">
          <StatusBadge status={raffle.status} />

          <View className="flex-row items-center space-x-1.5">
            {isManager ? (
              <Badge
                label="Manager 👑"
                variant="warning"
                size="sm"
                className="ml-1"
              />
            ) : null}
          </View>
        </View>

        {/* Title */}
        <Text className="text-lg font-bold text-gray-900 mt-1 mb-1">
          {raffle.name}
        </Text>

        {/* Topic */}
        {raffle.topic ? (
          <Text className="text-sm text-gray-600 mb-3" numberOfLines={2}>
            {raffle.topic}
          </Text>
        ) : null}

        {/* Info Grid */}
        <View className="flex-row items-center justify-between pt-3 border-t border-gray-100 mt-2">
          {/* Price limit */}
          <View className="flex-row items-center">
            <Ionicons name="pricetag-outline" size={16} color="#D97706" />
            <Text className="text-xs font-semibold text-gray-700 ml-1.5">
              Limit: {raffle.priceLimit} {raffle.currency}
            </Text>
          </View>

          {/* Gift date / Countdown */}
          <View className="flex-row items-center">
            <Ionicons name="calendar-outline" size={16} color="#15803D" />
            <Text className="text-xs font-semibold text-gray-700 ml-1.5">
              {formattedGiftDate}
            </Text>
          </View>
        </View>

        {/* Countdown preview badge if upcoming */}
        {diffDays > 0 ? (
          <View className="mt-3 bg-red-50 py-1.5 px-3 rounded-lg flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Text className="text-xs mr-1">⏳</Text>
              <Text className="text-xs font-medium text-[#B91C1C]">
                {diffDays === 1 ? '1 day left' : `${diffDays} days left until gift exchange`}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color="#B91C1C" />
          </View>
        ) : null}
      </View>
    </Card>
  );
};

export default RaffleCard;
