import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Participant } from '../../types';
import { Avatar } from '../ui/Avatar';

export interface ExclusionPickerProps {
  participant: Participant;
  allParticipants: Participant[];
  onToggle: (participantId: string) => void;
  className?: string;
}

export const ExclusionPicker: React.FC<ExclusionPickerProps> = ({
  participant,
  allParticipants,
  onToggle,
  className = '',
}) => {
  const candidates = allParticipants.filter((p) => p.id !== participant.id);

  return (
    <View className={`bg-white rounded-2xl p-4 border border-gray-100 shadow-xs ${className}`}>
      {/* Title */}
      <View className="flex-row items-center mb-2">
        <Ionicons name="hand-left-outline" size={18} color="#B91C1C" />
        <Text className="text-base font-bold text-gray-900 ml-2">
          {participant.name} cannot give to:
        </Text>
      </View>

      {/* Subtitle / note */}
      <View className="flex-row items-start bg-amber-50/80 p-2.5 rounded-xl border border-amber-200/60 mb-3.5">
        <Ionicons name="information-circle-outline" size={16} color="#D97706" className="mt-0.5" />
        <Text className="text-xs text-amber-800 ml-1.5 flex-1 leading-4">
          Exclusions are bidirectional — this person also won't receive from the excluded participants.
        </Text>
      </View>

      {/* Chips */}
      {candidates.length === 0 ? (
        <Text className="text-sm text-gray-400 italic py-2">
          No other participants to exclude.
        </Text>
      ) : (
        <View className="flex-row flex-wrap gap-2">
          {candidates.map((other) => {
            const isExcluded = participant.exclusions?.includes(other.id);

            return (
              <Pressable
                key={other.id}
                onPress={() => onToggle(other.id)}
                className={`flex-row items-center px-3 py-2 rounded-full border transition-all ${
                  isExcluded
                    ? 'bg-red-50 border-red-300'
                    : 'bg-gray-50 border-gray-200 active:bg-gray-100'
                }`}
              >
                <Avatar name={other.name} size="sm" />
                <Text
                  className={`text-xs font-semibold ml-2 mr-1 ${
                    isExcluded ? 'text-red-700' : 'text-gray-700'
                  }`}
                >
                  {other.name}
                </Text>
                {isExcluded ? (
                  <View className="w-4 h-4 rounded-full bg-red-200 items-center justify-center ml-0.5">
                    <Ionicons name="close" size={12} color="#B91C1C" />
                  </View>
                ) : (
                  <Ionicons name="add" size={14} color="#9CA3AF" />
                )}
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
};

export default ExclusionPicker;
