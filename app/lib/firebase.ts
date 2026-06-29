import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  Auth,
} from 'firebase/auth';
import { getAnalytics, Analytics } from 'firebase/analytics';

/**
 * Firebase is configured via VITE_ environment variables.
 * Vite bakes VITE_* vars into the browser bundle at build time.
 * These are public config values — security is enforced by Firebase Security Rules.
 */
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

let app: FirebaseApp;
let auth: Auth;
let analytics: Analytics | null = null;

try {
  if (!firebaseConfig.apiKey) {
    throw new Error('VITE_FIREBASE_API_KEY is not set.');
  }
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);

  // Analytics only runs in browser contexts (not SSR / Node)
  if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
    analytics = getAnalytics(app);
  }

  console.log('[Firebase] ✓ Initialized — project:', firebaseConfig.projectId);
} catch (e) {
  console.warn('[Firebase] Initialization skipped:', (e as Error).message);
  auth = null as unknown as Auth;
}

export { auth, analytics };

export const initAuth = (
  onAuthSuccess?: (user: User) => void,
  onAuthFailure?: () => void
) => {
  if (!auth) {
    onAuthFailure?.();
    return () => {};
  }
  return onAuthStateChanged(auth, (user: User | null) => {
    if (user) {
      onAuthSuccess?.(user);
    } else {
      onAuthFailure?.();
    }
  });
};

export const loginWithEmail = async (
  email: string,
  password: string
): Promise<{ user: User }> => {
  if (!auth) throw new Error('Firebase auth not initialized.');
  const result = await signInWithEmailAndPassword(auth, email, password);
  return { user: result.user };
};

export const registerWithEmail = async (
  email: string,
  password: string,
  name?: string
): Promise<{ user: User }> => {
  if (!auth) throw new Error('Firebase auth not initialized.');
  const result = await createUserWithEmailAndPassword(auth, email, password);
  if (name && result.user) {
    await updateProfile(result.user, { displayName: name });
  }
  return { user: result.user };
};

export const logout = async () => {
  await auth?.signOut();
};
