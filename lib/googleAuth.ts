import { User as FirebaseUser } from 'firebase/auth';

export async function nativeOrWebGoogleSignIn(): Promise<FirebaseUser> {
  throw new Error('Platform not implemented');
}

export async function nativeOrWebGoogleSignOut(): Promise<void> {
  // No-op for unsupported platforms
}

export function isGoogleAuthConfigured(): boolean {
  return true;
}
