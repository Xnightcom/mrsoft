import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let auth: ReturnType<typeof getAuth> | null = null;

function ensureFirebaseAuth() {
  if (typeof window === "undefined") return null;
  if (
    !firebaseConfig.apiKey ||
    !firebaseConfig.authDomain ||
    !firebaseConfig.projectId ||
    !firebaseConfig.appId
  ) {
    return null;
  }
  if (!getApps().length) {
    initializeApp(firebaseConfig);
  }
  if (!auth) {
    auth = getAuth();
  }
  return auth;
}

export const firebaseAuth = () => ensureFirebaseAuth();

export async function signInWithGooglePopup() {
  const authInstance = ensureFirebaseAuth();
  if (!authInstance) {
    throw new Error("Firebase is not configured for this environment.");
  }
  const provider = new GoogleAuthProvider();
  return signInWithPopup(authInstance, provider);
}

export function onFirebaseAuthState(cb: (user: FirebaseUser | null) => void) {
  const authInstance = ensureFirebaseAuth();
  if (!authInstance) {
    cb(null);
    return () => undefined;
  }
  return onAuthStateChanged(authInstance, cb);
}

export default firebaseAuth;
