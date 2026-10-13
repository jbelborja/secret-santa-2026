import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Participant } from '../../types';
import { Avatar } from '../ui/Avatar';
import { StatusBadge } from './StatusBadge';

export interface ParticipantRowProps {
  participant: Participant;
  allParticipants: Participant[];
  showAssignment?: boolean;
  isManager?: boolean;
  onToggleExclusion?: (targetId: string) => void;
  onRemove?: () => void;
  className?: string;
}

export const ParticipantRow: React.FC<ParticipantRowProps> = ({
  participant,
  allParticipants,
  showAssignment = false,
  isManager = false,
  onToggleExclusion,
  onRemove,
  className = '',
}) => {
  const recipient = showAssignment && participant.assignedTo
    ? allParticipants.find((p) => p.id === participant.assignedTo)
    : null;

  return (
    <View
      className={`bg-white rounded-xl p-3.5 mb-2 border border-gray-100 shadow-sm ${className}`}
    >
      <View className="flex-row items-center justify-between">
        {/* Left: Avatar & details */}
        <View className="flex-row items-center flex-1 mr-3">
          <Avatar name={participant.name} size="md" />

          <View className="ml-3 flex-1">
            <View className="flex-row items-center">
              <Text
                className="text-sm font-semibold text-gray-900"
                numberOfLines={1}
              >
                {participant.name}
              </Text>
              {participant.giftGiven ? (
                <View className="ml-2 flex-row items-center bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <Ionicons name="checkmark-circle" size={12} color="#059669" />
                  <Text className="text-[10px] font-semibold text-emerald-700 ml-0.5">
                    Gift sent
                  </Text>
                </View>
              ) : null}
            </View>

            <Text
              className="text-xs text-gray-400 mt-0.5"
              numberOfLines={1}
            >
              {participant.email}
            </Text>
          </View>
        </View>

        {/* Right: Status & remove */}
        <View className="flex-row items-center space-x-2">
          <StatusBadge status={participant.status} />

          {isManager && onRemove ? (
            <Pressable
              onPress={onRemove}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="ml-2 p-1.5 rounded-lg bg-red-50 active:bg-red-100"
            >
              <Ionicons name="trash-outline" size={15} color="#DC2626" />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Assignment row */}
      {showAssignment ? (
        <View className="mt-2.5 pt-2.5 border-t border-gray-100 flex-row items-center">
          <Text className="text-xs text-gray-400 mr-1.5">Gives gift to</Text>
          {recipient ? (
            <View className="flex-row items-center bg-red-50 px-2 py-0.5 rounded-md">
              <Ionicons name="arrow-forward" size={11} color="#B91C1C" />
              <Text className="text-xs font-semibold text-[#B91C1C] ml-1">
                {recipient.name}
              </Text>
            </View>
          ) : participant.assignedTo ? (
            <Text className="text-xs font-semibold text-gray-600">Assigned</Text>
          ) : (
            <Text className="text-xs text-gray-400 italic">Pending draw</Text>
          )}
        </View>
      ) : null}
    </View>
  );
};

export default ParticipantRow;
