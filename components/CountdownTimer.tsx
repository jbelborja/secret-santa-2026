import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';

export interface CountdownTimerProps {
  targetDate: Date | string | number;
  label?: string;
  className?: string;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

function calculateTimeRemaining(target: Date): TimeRemaining {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / 1000 / 60) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { days, hours, minutes, seconds, isPast: false };
}

import { useTranslation } from '../lib/i18n';

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  targetDate,
  label,
  className = '',
}) => {
  const { t } = useTranslation();
  const target = targetDate instanceof Date ? targetDate : new Date(targetDate);
  const [timeLeft, setTimeLeft] = useState<TimeRemaining>(() =>
    calculateTimeRemaining(target)
  );

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = calculateTimeRemaining(target);
      setTimeLeft(remaining);
      if (remaining.isPast) clearInterval(timer);
    }, 1000);

    return () => clearInterval(timer);
  }, [target.getTime()]);

  const padNumber = (num: number) => num.toString().padStart(2, '0');

  const Segment = ({ value, unit }: { value: number; unit: string }) => (
    <View className="items-center mx-1.5">
      <View className="w-14 h-14 bg-gray-900 rounded-xl items-center justify-center">
        <Text className="text-xl font-bold text-white tabular-nums">
          {padNumber(value)}
        </Text>
      </View>
      <Text className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mt-1.5">
        {unit}
      </Text>
    </View>
  );

  const Separator = () => (
    <Text className="text-lg font-light text-gray-300 mb-5">:</Text>
  );

  return (
    <View className={`items-center p-4 bg-gray-50 border border-gray-200 rounded-2xl ${className}`}>
      {label ? (
        <Text className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
          {label}
        </Text>
      ) : null}

      {timeLeft.isPast ? (
        <View className="py-2 px-4 bg-emerald-50 rounded-xl border border-emerald-200">
          <Text className="text-sm font-semibold text-emerald-700 text-center">
            {t('timer.past')}
          </Text>
        </View>
      ) : (
        <View className="flex-row items-center justify-center">
          <Segment value={timeLeft.days} unit={t('timer.days')} />
          <Separator />
          <Segment value={timeLeft.hours} unit={t('timer.hrs')} />
          <Separator />
          <Segment value={timeLeft.minutes} unit={t('timer.min')} />
          <Separator />
          <Segment value={timeLeft.seconds} unit={t('timer.sec')} />
        </View>
      )}
    </View>
  );
};

export default CountdownTimer;
