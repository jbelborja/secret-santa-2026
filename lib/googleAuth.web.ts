import { GoogleAuthProvider, signInWithPopup, User as FirebaseUser } from 'firebase/auth';
import { auth } from './firebase';

export async function nativeOrWebGoogleSignIn(): Promise<FirebaseUser> {
  const provider = new GoogleAuthProvider();
  provider.addScope('profile');
  provider.addScope('email');
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export function isGoogleAuthConfigured(): boolean {
  return true;
}
