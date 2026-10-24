import React from 'react';
import { Stack } from 'expo-router';
import { useTranslation } from '@/lib/i18n';

export default function RaffleLayout() {
  const { t } = useTranslation();

  return (
    <Stack
      screenOptions={{
        headerTintColor: '#B91C1C',
        headerBackTitle: t('common.back'),
        headerTitleStyle: {
          fontWeight: 'bold',
          color: '#111827',
        },
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        contentStyle: {
          backgroundColor: '#FAFAFA',
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerTitle: t('auth.appName'),
        }}
      />
      <Stack.Screen
        name="manage"
        options={{
          headerTitle: t('manageRaffle.headerTitle'),
        }}
      />
      <Stack.Screen
        name="participants"
        options={{
          headerTitle: t('participantsScreen.headerTitle'),
        }}
      />
      <Stack.Screen
        name="assignment"
        options={{
          headerTitle: t('assignment.headerTitle'),
        }}
      />
    </Stack>
  );
}
