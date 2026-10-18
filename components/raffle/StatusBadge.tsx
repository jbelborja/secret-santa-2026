import React from 'react';
import { View, Text } from 'react-native';
import { RaffleStatus, ParticipantStatus } from '../../types';

export interface StatusBadgeProps {
  status: RaffleStatus | ParticipantStatus;
  className?: string;
}

import { useTranslation } from '../../lib/i18n';

interface StyleConfig {
  containerClass: string;
  textClass: string;
}

const STYLE_MAP: Record<RaffleStatus | ParticipantStatus, StyleConfig> = {
  draft: {
    containerClass: 'bg-gray-100 border-gray-200',
    textClass: 'text-gray-600',
  },
  inviting: {
    containerClass: 'bg-sky-50 border-sky-200',
    textClass: 'text-sky-700',
  },
  drawn: {
    containerClass: 'bg-violet-50 border-violet-200',
    textClass: 'text-violet-700',
  },
  completed: {
    containerClass: 'bg-emerald-50 border-emerald-200',
    textClass: 'text-emerald-700',
  },
  invited: {
    containerClass: 'bg-sky-50 border-sky-200',
    textClass: 'text-sky-700',
  },
  accepted: {
    containerClass: 'bg-emerald-50 border-emerald-200',
    textClass: 'text-emerald-700',
  },
  declined: {
    containerClass: 'bg-red-50 border-red-200',
    textClass: 'text-red-600',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const { t } = useTranslation();
  const styleConfig = STYLE_MAP[status] || {
    containerClass: 'bg-gray-100 border-gray-200',
    textClass: 'text-gray-600',
  };

  const label = t(`status.${status}`) || String(status);

  return (
    <View
      className={`self-start px-2.5 py-0.5 rounded-full border items-center justify-center ${styleConfig.containerClass} ${className}`}
    >
      <Text className={`text-xs font-semibold ${styleConfig.textClass}`}>
        {label}
      </Text>
    </View>
  );
};

export default StatusBadge;
