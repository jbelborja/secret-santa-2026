import React from 'react';
import { View, Text } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button } from '@/components/ui/Button';

import { useTranslation } from '@/lib/i18n';

export default function NotFoundScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <>
      <Stack.Screen options={{ title: t('notFound.title'), headerShown: false }} />
      <View className="flex-1 items-center justify-center p-6 bg-white">
        <View className="w-20 h-20 rounded-2xl bg-red-50 border border-red-100 items-center justify-center mb-4 shadow-sm">
          <Ionicons name="compass-outline" size={36} color="#B91C1C" />
        </View>

        <Text className="text-2xl font-black text-gray-900 text-center mb-1">
          {t('notFound.title')}
        </Text>

        <Text className="text-sm text-gray-500 text-center max-w-xs mb-8">
          {t('notFound.message')}
        </Text>

        <Button
          title={t('notFound.returnHome')}
          variant="primary"
          size="lg"
          onPress={() => router.replace('/(tabs)')}
          leftIcon={<Ionicons name="home-outline" size={18} color="#FFFFFF" />}
          className="min-w-[200px]"
        />
      </View>
    </>
  );
}
