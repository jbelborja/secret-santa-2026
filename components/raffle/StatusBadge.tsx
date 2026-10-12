import React from 'react';
import { View, Text } from 'react-native';
import { RaffleStatus, ParticipantStatus } from '../../types';

export interface StatusBadgeProps {
  status: RaffleStatus | ParticipantStatus;
  className?: string;
}

interface StatusConfig {
  label: string;
  containerClass: string;
  textClass: string;
}

const STATUS_MAP: Record<RaffleStatus | ParticipantStatus, StatusConfig> = {
  draft: {
    label: 'Draft',
    containerClass: 'bg-gray-100 border-gray-200',
    textClass: 'text-gray-700',
  },
  inviting: {
    label: 'Inviting',
    containerClass: 'bg-blue-100 border-blue-200',
    textClass: 'text-blue-700',
  },
  drawn: {
    label: 'Drawn 🎲',
    containerClass: 'bg-purple-100 border-purple-200',
    textClass: 'text-purple-700',
  },
  completed: {
    label: 'Completed ✅',
    containerClass: 'bg-green-100 border-green-200',
    textClass: 'text-[#15803D]',
  },
  invited: {
    label: 'Invited',
    containerClass: 'bg-blue-100 border-blue-200',
    textClass: 'text-blue-700',
  },
  accepted: {
    label: 'Accepted ✓',
    containerClass: 'bg-green-100 border-green-200',
    textClass: 'text-[#15803D]',
  },
  declined: {
    label: 'Declined',
    containerClass: 'bg-red-100 border-red-200',
    textClass: 'text-red-700',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const config = STATUS_MAP[status] || {
    label: String(status),
    containerClass: 'bg-gray-100 border-gray-200',
    textClass: 'text-gray-700',
  };

  return (
    <View
      className={`self-start px-2.5 py-0.5 rounded-full border items-center justify-center ${config.containerClass} ${className}`}
    >
      <Text className={`text-xs font-semibold ${config.textClass}`}>
        {config.label}
      </Text>
    </View>
  );
};

export default StatusBadge;
