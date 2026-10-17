import '../global.css';

import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
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

  return (
    <SafeAreaProvider style={styles.container}>
      <StatusBar style="dark" />
      {loading ? (
        <View style={styles.loadingContainer}>
          <View style={styles.iconBox}>
            <Ionicons name="gift-outline" size={32} color="#B91C1C" />
          </View>
          <Text style={styles.title}>
            Secret Santa
          </Text>
          <Text style={styles.subtitle}>
            Loading...
          </Text>
          <ActivityIndicator size="small" color="#B91C1C" />
        </View>
      ) : (
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
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 24,
  },
});
