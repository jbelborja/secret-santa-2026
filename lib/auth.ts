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
import { nativeOrWebGoogleSignIn, isGoogleAuthConfigured } from './googleAuth';

/**
 * Format Firebase Auth errors into clear, actionable messages
 */
export function formatAuthError(err: unknown): string {
  if (!(err instanceof Error)) return 'An unexpected authentication error occurred.';
  const code = (err as any)?.code || '';
  if (code === 'auth/configuration-not-found') {
    return 'Authentication is not activated in your Firebase project yet. Go to Firebase Console > Authentication > Click "Get started" and enable Email/Password & Google.';
  }
  if (code === 'auth/operation-not-allowed') {
    return 'This sign-in method is disabled. In Firebase Console > Authentication > Sign-in method, please enable Email/Password and Google.';
  }
  if (code === 'auth/email-already-in-use') {
    return 'This email address is already registered. Please sign in instead.';
  }
  if (code === 'auth/weak-password') {
    return 'Password is too weak. Please use at least 6 characters.';
  }
  if (code === 'auth/invalid-email') {
    return 'Please enter a valid email address.';
  }
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    return 'Invalid email or password.';
  }
  if (code === 'auth/unauthorized-domain') {
    return 'Dominio no autorizado: Debes añadir "jbelborja.github.io" en Firebase Console > Authentication > Settings > Authorized domains.';
  }
  if (
    code === 'auth/popup-closed-by-user' ||
    code === 'SIGN_IN_CANCELLED' ||
    code === '13' ||
    code === '12501'
  ) {
    return 'Inicio de sesión cancelado.';
  }
  return err.message.replace(/^Firebase:\s*(Error\s*)?/, '').replace(/\s*\(auth\/[^)]+\)\.?$/, '');
}

/**
 * Ensures a user document exists in Firestore.
 */
export async function syncUserDocument(user: FirebaseUser, displayName?: string): Promise<User> {
  const name = displayName || user.displayName || user.email?.split('@')[0] || 'Santa Fan';
  const userData: User = {
    uid: user.uid,
    displayName: name,
    email: user.email || '',
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
    const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
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
    const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
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
