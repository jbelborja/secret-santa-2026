import { User as FirebaseUser } from 'firebase/auth';

export async function nativeOrWebGoogleSignIn(): Promise<FirebaseUser> {
  throw new Error('Platform not implemented');
}

export function isGoogleAuthConfigured(): boolean {
  return true;
}
