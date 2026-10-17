import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
// @ts-ignore - getReactNativePersistence is provided by React Native bundle of firebase/auth
import { initializeAuth, getReactNativePersistence, getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
};

// Avoid re-initializing on hot reload; fallback gracefully if env vars not provided
let app: FirebaseApp;
if (getApps().length > 0) {
  app = getApps()[0];
} else if (firebaseConfig.apiKey) {
  app = initializeApp(firebaseConfig);
} else {
  console.warn(
    'Firebase configuration missing. Set EXPO_PUBLIC_FIREBASE_API_KEY in .env or GitHub Secrets.'
  );
  app = initializeApp({
    apiKey: 'placeholder-missing-key',
    projectId: 'placeholder-project',
    appId: '1:000000000000:web:placeholder',
  });
}

import { Platform } from 'react-native';

// Auth with persistence: AsyncStorage on native mobile, default browser persistence on web
let auth: Auth;
if (Platform.OS === 'web') {
  try {
    auth = getAuth(app);
  } catch (err) {
    console.warn('Web auth init warning:', err);
    auth = {} as Auth;
  }
} else {
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    try {
      auth = getAuth(app);
    } catch (err) {
      console.warn('Native auth init warning:', err);
      auth = {} as Auth;
    }
  }
}

export { app, auth };
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);
