import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
  User as FirebaseUser,
} from 'firebase/auth';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { auth } from './firebase';
import { setDoc, userDoc } from './firestore';
import { User } from '../types';

WebBrowser.maybeCompleteAuthSession();

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

  const ref = userDoc(user.uid);
  await setDoc(ref, userData, { merge: true });
  return userData;
}

export async function signInWithEmail(email: string, password: string): Promise<FirebaseUser> {
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
  return credential.user;
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string
): Promise<FirebaseUser> {
  const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (displayName) {
    await updateProfile(credential.user, { displayName: displayName.trim() });
  }
  await syncUserDocument(credential.user, displayName.trim());
  return credential.user;
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
 * Google Auth Session Hook
 */
export function useGoogleAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const isConfigured = Boolean(webClientId);

  const discovery = {
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
  };

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: webClientId,
      scopes: ['openid', 'profile', 'email'],
      responseType: AuthSession.ResponseType.IdToken,
      redirectUri: AuthSession.makeRedirectUri({
        scheme: 'secretsanta',
      }),
    },
    discovery
  );

  useEffect(() => {
    async function handleResponse() {
      if (response?.type === 'success' && response.params.id_token) {
        setLoading(true);
        setError(null);
        try {
          const credential = GoogleAuthProvider.credential(response.params.id_token);
          const result = await signInWithCredential(auth, credential);
          await syncUserDocument(result.user);
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : 'Google sign-in failed');
        } finally {
          setLoading(false);
        }
      } else if (response?.type === 'error') {
        setError(response.error?.message || 'Google authentication was cancelled or failed');
      }
    }

    handleResponse();
  }, [response]);

  const signIn = async () => {
    if (!isConfigured) {
      throw new Error('Google Web Client ID is not configured in environment variables');
    }
    setError(null);
    return promptAsync();
  };

  return {
    signIn,
    loading: loading || !request,
    isConfigured,
    error,
  };
}
