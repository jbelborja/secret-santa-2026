import '../global.css';

import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/hooks/useAuth';
import { updateDoc, userDoc } from '@/lib/firestore';
import {
  setupNotificationHandler,
  registerForPushNotificationsAsync,
  useNotificationListener,
} from '@/lib/notifications';

setupNotificationHandler();

export default function RootLayout() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Setup notification listeners
  useNotificationListener(
    (notification) => {
      console.log('Push notification received:', notification.request.content.title);
    },
    (response) => {
      const data = response.notification.request.content.data;
      if (data?.raffleId) {
        router.push(`/raffle/${data.raffleId}` as any);
      }
    }
  );

  // Register push notifications on mount and store token in Firestore
  useEffect(() => {
    async function setupToken() {
      if (user?.uid) {
        try {
          const token = await registerForPushNotificationsAsync();
          if (token && token !== user.expoPushToken) {
            await updateDoc(userDoc(user.uid), {
              expoPushToken: token,
            });
          }
        } catch (err) {
          console.warn('Failed to register push token:', err);
        }
      }
    }

    setupToken();
  }, [user?.uid, user?.expoPushToken]);

  // Handle protected route authentication redirection
  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      // User is logged out and trying to access app -> redirect to login
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      // User is logged in and on auth screen -> redirect to main tabs
      router.replace('/(tabs)');
    }
  }, [user, loading, segments, router]);

  if (loading) {
    return (
      <SafeAreaProvider>
        <View className="flex-1 bg-white items-center justify-center p-6">
          <View className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 items-center justify-center mb-4 shadow-sm">
            <Ionicons name="gift-outline" size={32} color="#B91C1C" />
          </View>
          <Text className="text-xl font-bold text-gray-900 mb-1 tracking-tight">
            Secret Santa
          </Text>
          <Text className="text-xs text-gray-500 mb-6">
            Loading...
          </Text>
          <ActivityIndicator size="small" color="#B91C1C" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerTintColor: '#B91C1C',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: '#FAFAFA',
          },
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="raffle/create"
          options={{
            headerTitle: 'Create Secret Santa',
            presentation: 'modal',
            headerStyle: { backgroundColor: '#FFFFFF' },
          }}
        />
        <Stack.Screen
          name="raffle/[id]"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="invite/[code]"
          options={{
            headerTitle: 'Join Raffle',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="+not-found"
          options={{
            title: 'Oops!',
            headerShown: false,
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
