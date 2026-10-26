import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  OAuthProvider,
  signInWithCredential,
  User as FirebaseUser,
} from 'firebase/auth';
import * as AppleAuthentication from 'expo-apple-authentication';
import { auth } from './firebase';
import { setDoc, userDoc } from './firestore';
import { User } from '../types';
import {
  nativeOrWebGoogleSignIn,
  nativeOrWebGoogleSignOut,
  isGoogleAuthConfigured,
} from './googleAuth';

import { getActiveLanguage } from './i18n';

/**
 * Format Firebase Auth errors into clear, actionable messages
 */
export function formatAuthError(err: unknown, lang: 'es' | 'en' = getActiveLanguage()): string {
  const isEs = lang === 'es';
  if (!(err instanceof Error)) {
    return isEs
      ? 'Ocurrió un error inesperado durante la autenticación.'
      : 'An unexpected authentication error occurred.';
  }
  const code = (err as any)?.code || '';
  if (code === 'auth/configuration-not-found') {
    return isEs
      ? 'La autenticación no está activada en Firebase todavía. Ve a Firebase Console > Authentication > Comenzar y activa Correo/Contraseña y Google.'
      : 'Authentication is not activated in your Firebase project yet. Go to Firebase Console > Authentication > Click "Get started" and enable Email/Password & Google.';
  }
  if (code === 'auth/operation-not-allowed') {
    return isEs
      ? 'Este método de inicio de sesión está desactivado. En Firebase Console > Authentication > Sign-in method, activa Correo/Contraseña y Google.'
      : 'This sign-in method is disabled. In Firebase Console > Authentication > Sign-in method, please enable Email/Password and Google.';
  }
  if (code === 'auth/email-already-in-use') {
    return isEs
      ? 'Este correo electrónico ya está registrado. Por favor, inicia sesión.'
      : 'This email address is already registered. Please sign in instead.';
  }
  if (code === 'auth/weak-password') {
    return isEs
      ? 'La contraseña es demasiado débil. Usa al menos 6 caracteres.'
      : 'Password is too weak. Please use at least 6 characters.';
  }
  if (code === 'auth/invalid-email') {
    return isEs
      ? 'Por favor, introduce una dirección de correo válida.'
      : 'Please enter a valid email address.';
  }
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    return isEs
      ? 'Correo electrónico o contraseña incorrectos.'
      : 'Invalid email or password.';
  }
  if (code === 'auth/unauthorized-domain') {
    return isEs
      ? 'Dominio no autorizado: Debes añadir "jbelborja.github.io" en Firebase Console > Authentication > Settings > Authorized domains.'
      : 'Unauthorized domain: You must add "jbelborja.github.io" in Firebase Console > Authentication > Settings > Authorized domains.';
  }
  if (
    code === 'auth/popup-closed-by-user' ||
    code === 'SIGN_IN_CANCELLED' ||
    code === '13' ||
    code === '12501'
  ) {
    return isEs ? 'Inicio de sesión cancelado.' : 'Sign in cancelled.';
  }
  return err.message.replace(/^Firebase:\s*(Error\s*)?/, '').replace(/\s*\(auth\/[^)]+\)\.?$/, '');
}

/**
 * Ensures a user document exists in Firestore.
 */
export async function syncUserDocument(user: FirebaseUser, displayName?: string): Promise<User> {
  const defaultName = getActiveLanguage() === 'es' ? 'Amigo Invisible' : 'Santa Fan';
  const name = displayName || user.displayName || user.email?.split('@')[0] || defaultName;
  const userData: User = {
    uid: user.uid,
    displayName: name,
    email: (user.email || '').trim().toLowerCase(),
    photoURL: user.photoURL || undefined,
    createdAt: new Date(),
  };

  try {
    const ref = userDoc(user.uid);
    await setDoc(ref, userData, { merge: true });
  } catch (err) {
    console.warn('Firestore profile sync note:', err);
  }
  return userData;
}

export async function signInWithEmail(email: string, password: string): Promise<FirebaseUser> {
  try {
    const credential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
    return credential.user;
  } catch (err) {
    throw new Error(formatAuthError(err));
  }
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string
): Promise<FirebaseUser> {
  try {
    const credential = await createUserWithEmailAndPassword(
      auth,
      email.trim().toLowerCase(),
      password
    );
    if (displayName) {
      await updateProfile(credential.user, { displayName: displayName.trim() });
    }
    await syncUserDocument(credential.user, displayName.trim());
    return credential.user;
  } catch (err) {
    throw new Error(formatAuthError(err));
  }
}

export async function logOut(): Promise<void> {
  try {
    await nativeOrWebGoogleSignOut();
  } catch (err) {
    console.warn('Google sign-out error during logOut:', err);
  }
  await firebaseSignOut(auth);
}

/**
 * Apple Sign In for iOS
 */
export async function signInWithApple(): Promise<FirebaseUser> {
  if (Platform.OS !== 'ios') {
    throw new Error('Apple Sign In is only supported on iOS');
  }

  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  if (!credential.identityToken) {
    throw new Error('Apple Sign In failed: No identity token returned.');
  }

  const provider = new OAuthProvider('apple.com');
  const authCredential = provider.credential({
    idToken: credential.identityToken,
  });

  const result = await signInWithCredential(auth, authCredential);

  let formattedName = '';
  if (credential.fullName?.givenName || credential.fullName?.familyName) {
    formattedName = `${credential.fullName?.givenName || ''} ${
      credential.fullName?.familyName || ''
    }`.trim();
  }

  await syncUserDocument(result.user, formattedName || undefined);
  return result.user;
}

/**
 * Google Auth Hook (Native Google Play Services on Android/iOS, Popup on Web)
 */
export function useGoogleAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConfigured = isGoogleAuthConfigured();

  const signIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const user = await nativeOrWebGoogleSignIn();
      await syncUserDocument(user);
      return user;
    } catch (err: unknown) {
      const code = (err as any)?.code;
      // Do not treat user cancellation as an error
      if (
        code === 'SIGN_IN_CANCELLED' ||
        code === '13' ||
        code === '12501' ||
        code === 'auth/popup-closed-by-user'
      ) {
        return null;
      }
      const msg = formatAuthError(err);
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  return {
    signIn,
    loading,
    isConfigured,
    error,
  };
}
