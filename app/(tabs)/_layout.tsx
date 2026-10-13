import React from 'react';
import { View, Text } from 'react-native';
import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#B91C1C',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#F3F4F6',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerShadowVisible: false,
        headerTitle: () => (
          <View className="flex-row items-center">
            <View className="w-7 h-7 rounded-lg bg-red-50 items-center justify-center mr-2 border border-red-100">
              <Ionicons name="gift-outline" size={16} color="#B91C1C" />
            </View>
            <Text className="text-lg font-black text-gray-900 tracking-tight">
              Secret Santa
            </Text>
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'My Raffles',
          tabBarLabel: 'My Raffles',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'gift' : 'gift-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'person-circle' : 'person-circle-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
