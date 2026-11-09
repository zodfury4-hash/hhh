// Firebase Client SDK bridge using global scripts loaded in index.html

declare global {
  interface Window {
    firebase: any;
    fbAuth: any;
    fbDb: any;
    FIREBASE_CONFIG: any;
  }
}

export async function signInWithGooglePopup(): Promise<{ idToken: string; user: any }> {
  if (typeof window === 'undefined') {
    throw new Error('Window is not available');
  }

  const firebase = window.firebase;
  if (!firebase || typeof firebase.auth !== 'function') {
    throw new Error('Firebase Auth is initializing. Please try again in a moment.');
  }

  const authInstance = window.fbAuth || firebase.auth();
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  const result = await authInstance.signInWithPopup(provider);
  const user = result.user;
  const idToken = await user.getIdToken();
  return { idToken, user };
}
