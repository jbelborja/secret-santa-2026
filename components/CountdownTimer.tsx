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

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  targetDate,
  label,
  className = '',
}) => {
  const target = targetDate instanceof Date ? targetDate : new Date(targetDate);
  const [timeLeft, setTimeLeft] = useState<TimeRemaining>(() =>
    calculateTimeRemaining(target)
  );

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = calculateTimeRemaining(target);
      setTimeLeft(remaining);
      if (remaining.isPast) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [target.getTime()]);

  const padNumber = (num: number) => num.toString().padStart(2, '0');

  return (
    <View className={`items-center justify-center p-4 bg-red-50/70 border border-red-100 rounded-2xl ${className}`}>
      {label ? (
        <Text className="text-xs font-bold uppercase tracking-wider text-[#B91C1C] mb-3">
          🎄 {label}
        </Text>
      ) : null}

      {timeLeft.isPast ? (
        <View className="py-2 px-4 bg-emerald-50 rounded-xl border border-emerald-200">
          <Text className="text-sm font-semibold text-[#15803D] text-center">
            🎁 Happened already!
          </Text>
        </View>
      ) : (
        <View className="flex-row items-center justify-center space-x-2">
          {/* Days */}
          <View className="items-center mx-1">
            <View className="w-14 h-14 bg-[#B91C1C] rounded-xl items-center justify-center shadow-sm">
              <Text className="text-xl font-extrabold text-white">
                {padNumber(timeLeft.days)}
              </Text>
            </View>
            <Text className="text-[10px] font-semibold text-gray-500 uppercase mt-1">
              Days
            </Text>
          </View>

          <Text className="text-lg font-bold text-gray-400 mb-4">:</Text>

          {/* Hours */}
          <View className="items-center mx-1">
            <View className="w-14 h-14 bg-[#15803D] rounded-xl items-center justify-center shadow-sm">
              <Text className="text-xl font-extrabold text-white">
                {padNumber(timeLeft.hours)}
              </Text>
            </View>
            <Text className="text-[10px] font-semibold text-gray-500 uppercase mt-1">
              Hours
            </Text>
          </View>

          <Text className="text-lg font-bold text-gray-400 mb-4">:</Text>

          {/* Minutes */}
          <View className="items-center mx-1">
            <View className="w-14 h-14 bg-[#D97706] rounded-xl items-center justify-center shadow-sm">
              <Text className="text-xl font-extrabold text-white">
                {padNumber(timeLeft.minutes)}
              </Text>
            </View>
            <Text className="text-[10px] font-semibold text-gray-500 uppercase mt-1">
              Mins
            </Text>
          </View>

          <Text className="text-lg font-bold text-gray-400 mb-4">:</Text>

          {/* Seconds */}
          <View className="items-center mx-1">
            <View className="w-14 h-14 bg-gray-900 rounded-xl items-center justify-center shadow-sm">
              <Text className="text-xl font-extrabold text-white">
                {padNumber(timeLeft.seconds)}
              </Text>
            </View>
            <Text className="text-[10px] font-semibold text-gray-500 uppercase mt-1">
              Secs
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default CountdownTimer;
