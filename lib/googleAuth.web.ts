import { GoogleAuthProvider, signInWithPopup, User as FirebaseUser } from 'firebase/auth';
import { auth } from './firebase';

export async function nativeOrWebGoogleSignIn(): Promise<FirebaseUser> {
  const provider = new GoogleAuthProvider();
  provider.addScope('profile');
  provider.addScope('email');
  provider.setCustomParameters({
    prompt: 'select_account',
  });
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function nativeOrWebGoogleSignOut(): Promise<void> {
  // On web, Firebase signOut clears the auth state and prompt: 'select_account' forces the account picker
}

export function isGoogleAuthConfigured(): boolean {
  return true;
}
