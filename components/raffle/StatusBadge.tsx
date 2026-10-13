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
    textClass: 'text-gray-600',
  },
  inviting: {
    label: 'Open',
    containerClass: 'bg-sky-50 border-sky-200',
    textClass: 'text-sky-700',
  },
  drawn: {
    label: 'Drawn',
    containerClass: 'bg-violet-50 border-violet-200',
    textClass: 'text-violet-700',
  },
  completed: {
    label: 'Completed',
    containerClass: 'bg-emerald-50 border-emerald-200',
    textClass: 'text-emerald-700',
  },
  invited: {
    label: 'Invited',
    containerClass: 'bg-sky-50 border-sky-200',
    textClass: 'text-sky-700',
  },
  accepted: {
    label: 'Accepted',
    containerClass: 'bg-emerald-50 border-emerald-200',
    textClass: 'text-emerald-700',
  },
  declined: {
    label: 'Declined',
    containerClass: 'bg-red-50 border-red-200',
    textClass: 'text-red-600',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const config = STATUS_MAP[status] || {
    label: String(status),
    containerClass: 'bg-gray-100 border-gray-200',
    textClass: 'text-gray-600',
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
