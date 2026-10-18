import React from 'react';
import { View, Text, Image } from 'react-native';
import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useTranslation } from '@/lib/i18n';

export default function TabsLayout() {
  const { t } = useTranslation();

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
            <View className="w-8 h-8 rounded-lg overflow-hidden mr-2.5 border border-red-100 bg-red-50 items-center justify-center shadow-xs">
              <Image
                source={require('../../assets/icon.png')}
                style={{ width: 32, height: 32, borderRadius: 8 }}
                resizeMode="cover"
              />
            </View>
            <Text className="text-lg font-black text-gray-900 tracking-tight">
              {t('auth.appName')}
            </Text>
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.myRaffles'),
          tabBarLabel: t('tabs.myRaffles'),
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
          title: t('tabs.profile'),
          tabBarLabel: t('tabs.profile'),
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
