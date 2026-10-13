import React from 'react';
import { View, Text } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button } from '@/components/ui/Button';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ title: 'Page Not Found', headerShown: false }} />
      <View className="flex-1 items-center justify-center p-6 bg-white">
        <View className="w-20 h-20 rounded-2xl bg-red-50 border border-red-100 items-center justify-center mb-4 shadow-sm">
          <Ionicons name="compass-outline" size={36} color="#B91C1C" />
        </View>

        <Text className="text-2xl font-black text-gray-900 text-center mb-1">
          Page Not Found
        </Text>

        <Text className="text-sm text-gray-500 text-center max-w-xs mb-8">
          The page you're looking for doesn't exist or may have been moved.
        </Text>

        <Button
          title="Return to Home"
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
