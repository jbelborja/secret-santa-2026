import { GoogleSignin, isSuccessResponse, statusCodes } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential, User as FirebaseUser } from 'firebase/auth';
import { auth } from './firebase';

const WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  '553006398541-k0n27c85h262eqmn7kjrdtqq67boofir.apps.googleusercontent.com';

let isConfigured = false;

function ensureConfigured() {
  if (!isConfigured) {
    GoogleSignin.configure({
      webClientId: WEB_CLIENT_ID,
      scopes: ['profile', 'email'],
    });
    isConfigured = true;
  }
}

export async function nativeOrWebGoogleSignIn(): Promise<FirebaseUser> {
  ensureConfigured();
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();

  let idToken: string | null = null;
  if (isSuccessResponse(response)) {
    idToken = response.data.idToken;
  } else if ((response as any).idToken) {
    idToken = (response as any).idToken;
  }

  if (!idToken) {
    const tokens = await GoogleSignin.getTokens();
    idToken = tokens.idToken;
  }

  if (!idToken) {
    throw new Error('No se pudo obtener el token de autenticación de Google.');
  }

  const credential = GoogleAuthProvider.credential(idToken);
  const userCredential = await signInWithCredential(auth, credential);
  return userCredential.user;
}

export function isGoogleAuthConfigured(): boolean {
  return Boolean(WEB_CLIENT_ID);
}
