import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { NotificationPayload } from '../types';

/**
 * Configure foreground notification behavior
 */
export function setupNotificationHandler() {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch (err) {
    console.warn('Failed to configure notification handler:', err);
  }
}

/**
 * Request notification permissions and fetch the Expo Push Token.
 */
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  if (Platform.OS === 'web') {
    return undefined;
  }

  let token: string | undefined;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return undefined;
  }

  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    token = tokenResponse.data;
  } catch (error) {
    console.warn('Failed to obtain Expo Push Token:', error);
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default Secret Santa Channel',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#B91C1C',
    });
  }

  return token;
}

/**
 * Hook to listen for foreground notifications and response interactions
 */
export function useNotificationListener(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationResponse?: (response: Notifications.NotificationResponse) => void
) {
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        onNotificationReceived?.(notification);
      }
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        onNotificationResponse?.(response);
      }
    );

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [onNotificationReceived, onNotificationResponse]);
}

/**
 * Send push notification using the Expo Push API.
 */
export async function sendPushNotification(
  expoPushToken: string,
  payload: NotificationPayload
): Promise<boolean> {
  if (!expoPushToken || !expoPushToken.startsWith('ExponentPushToken[')) {
    return false;
  }

  const message = {
    to: expoPushToken,
    sound: 'default',
    title: payload.title,
    body: payload.body,
    data: payload.data || {},
  };

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    return response.ok;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
}

/**
 * Batch send push notifications to multiple recipients
 */
export async function sendBatchPushNotifications(
  tokens: string[],
  payload: NotificationPayload
): Promise<void> {
  const validTokens = tokens.filter((t) => t && t.startsWith('ExponentPushToken['));
  if (validTokens.length === 0) return;

  const messages = validTokens.map((to) => ({
    to,
    sound: 'default',
    title: payload.title,
    body: payload.body,
    data: payload.data || {},
  }));

  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });
  } catch (error) {
    console.error('Error sending batch push notifications:', error);
  }
}
