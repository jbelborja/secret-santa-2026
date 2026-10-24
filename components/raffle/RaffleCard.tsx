import React from 'react';
import { View, Text, Image } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Raffle } from '../../types';
import { Card } from '../ui/Card';
import { StatusBadge } from './StatusBadge';
import { Badge } from '../ui/Badge';

import { useTranslation } from '../../lib/i18n';

export interface RaffleCardProps {
  raffle: Raffle;
  onPress: () => void;
  isManager?: boolean;
  isPending?: boolean;
  className?: string;
}

export const RaffleCard: React.FC<RaffleCardProps> = ({
  raffle,
  onPress,
  isManager = false,
  isPending = false,
  className = '',
}) => {
  const { t, formatDate } = useTranslation();
  const giftDate =
    raffle.giftDate instanceof Date ? raffle.giftDate : new Date(raffle.giftDate);

  const now = new Date();
  const diffDays = Math.ceil(
    (giftDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  const formattedGiftDate = formatDate(giftDate, 'MMM d, yyyy');

  return (
    <Card
      onPress={onPress}
      elevated
      className={`overflow-hidden border border-gray-100 p-0 mb-3 bg-white ${className}`}
    >
      {/* Header band */}
      {raffle.coverImageUrl ? (
        <View className="h-32 w-full relative">
          <Image
            source={{ uri: raffle.coverImageUrl }}
            className="w-full h-full"
            resizeMode="cover"
          />
          <View className="absolute inset-0 bg-black/25" />
        </View>
      ) : (
        <View className="h-12 w-full bg-[#B91C1C] flex-row items-center px-4">
          <Ionicons name="gift-outline" size={16} color="rgba(255,255,255,0.7)" />
          <Text className="text-white text-xs font-semibold tracking-widest uppercase ml-2">
            {t('raffleCard.secretSanta')}
          </Text>
        </View>
      )}

      {/* Main content */}
      <View className="p-4">
        {/* Top row: status + manager badge */}
        <View className="flex-row items-center justify-between mb-2.5">
          <View className="flex-row items-center space-x-1.5">
            <StatusBadge status={raffle.status} />
            {isPending ? (
              <View className="ml-1.5">
                <Badge
                  label={t('home.pendingBadge')}
                  variant="warning"
                  size="sm"
                />
              </View>
            ) : null}
          </View>
          {isManager ? (
            <Badge
              label={t('raffleCard.organizer')}
              variant="warning"
              size="sm"
            />
          ) : null}
        </View>

        {/* Title */}
        <Text className="text-base font-bold text-gray-900 mb-0.5">
          {raffle.name}
        </Text>

        {/* Topic */}
        {raffle.topic ? (
          <Text className="text-sm text-gray-500 mb-3" numberOfLines={1}>
            {raffle.topic}
          </Text>
        ) : null}

        {/* Info row */}
        <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
          <View className="flex-row items-center">
            <Ionicons name="pricetag-outline" size={14} color="#9CA3AF" />
            <Text className="text-xs text-gray-500 ml-1.5">
              {raffle.priceLimit} {raffle.currency}
            </Text>
          </View>

          <View className="flex-row items-center">
            <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />
            <Text className="text-xs text-gray-500 ml-1.5">
              {formattedGiftDate}
            </Text>
          </View>
        </View>

        {/* Pending Action Strip or Countdown strip */}
        {isPending ? (
          <View className="mt-3 bg-amber-50 border border-amber-200 py-2 px-3 rounded-lg flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="mail-open-outline" size={14} color="#D97706" />
              <Text className="text-xs font-bold text-amber-800 ml-1.5">
                {t('home.reviewAndAccept')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={13} color="#D97706" />
          </View>
        ) : diffDays > 0 ? (
          <View className="mt-3 bg-red-50 py-2 px-3 rounded-lg flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="time-outline" size={13} color="#B91C1C" />
              <Text className="text-xs font-medium text-[#B91C1C] ml-1.5">
                {diffDays === 1
                  ? t('raffleCard.oneDayUntil')
                  : t('raffleCard.daysUntil', { count: diffDays })}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={13} color="#B91C1C" />
          </View>
        ) : null}
      </View>
    </Card>
  );
};

export default RaffleCard;
