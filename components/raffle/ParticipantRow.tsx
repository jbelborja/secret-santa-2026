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
      className={`bg-white rounded-xl p-3.5 mb-2.5 border border-gray-100 shadow-xs flex-col ${className}`}
    >
      <View className="flex-row items-center justify-between">
        {/* Left: Avatar & details */}
        <View className="flex-row items-center flex-1 mr-3">
          <Avatar name={participant.name} size="md" />

          <View className="ml-3 flex-1">
            <View className="flex-row items-center">
              <Text
                className="text-base font-semibold text-gray-900"
                numberOfLines={1}
              >
                {participant.name}
              </Text>
              {participant.giftGiven ? (
                <View className="ml-2 flex-row items-center bg-green-50 px-1.5 py-0.5 rounded-full border border-green-200">
                  <Ionicons name="checkmark-circle" size={13} color="#15803D" />
                  <Text className="text-[10px] font-bold text-[#15803D] ml-0.5">
                    Gift Sent
                  </Text>
                </View>
              ) : null}
            </View>

            <Text
              className="text-xs text-gray-500 mt-0.5"
              numberOfLines={1}
            >
              {participant.email}
            </Text>
          </View>
        </View>

        {/* Right: Status badge & remove button */}
        <View className="flex-row items-center space-x-2">
          <StatusBadge status={participant.status} />

          {isManager && onRemove ? (
            <Pressable
              onPress={onRemove}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="ml-2 p-1.5 rounded-lg bg-red-50 active:bg-red-100"
            >
              <Ionicons name="trash-outline" size={16} color="#DC2626" />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Assignment row if active */}
      {showAssignment ? (
        <View className="mt-2.5 pt-2.5 border-t border-gray-100 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Text className="text-xs text-gray-500 mr-1.5">Gives gift to:</Text>
            {recipient ? (
              <View className="flex-row items-center bg-red-50/70 px-2 py-0.5 rounded-md">
                <Ionicons name="gift" size={12} color="#B91C1C" />
                <Text className="text-xs font-bold text-[#B91C1C] ml-1">
                  {recipient.name}
                </Text>
              </View>
            ) : participant.assignedTo ? (
              <Text className="text-xs font-semibold text-gray-700">
                Assigned
              </Text>
            ) : (
              <Text className="text-xs italic text-gray-400">
                Not yet drawn
              </Text>
            )}
          </View>
        </View>
      ) : null}
    </View>
  );
};

export default ParticipantRow;
