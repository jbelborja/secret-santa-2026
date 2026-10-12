import React from 'react';
import { Stack } from 'expo-router';

export default function RaffleLayout() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: '#B91C1C',
        headerBackTitle: 'Back',
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
          headerTitle: 'Secret Santa',
        }}
      />
      <Stack.Screen
        name="manage"
        options={{
          headerTitle: 'Manage Raffle 👑',
        }}
      />
      <Stack.Screen
        name="participants"
        options={{
          headerTitle: 'Participants 👥',
        }}
      />
      <Stack.Screen
        name="assignment"
        options={{
          headerTitle: 'My Assignment 🎁',
        }}
      />
    </Stack>
  );
}
