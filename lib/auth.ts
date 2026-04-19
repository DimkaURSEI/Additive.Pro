import { auth } from './firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut, 
  User,
  onAuthStateChanged as firebaseOnAuthStateChanged
} from 'firebase/auth';

const provider = new GoogleAuthProvider();

export async function signIn(): Promise<User> {
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export function getCurrentUser(): User | null {
  return auth.currentUser;
}

export function onAuthStateChanged(callback: (user: User | null) => void): () => void {
  return firebaseOnAuthStateChanged(auth, callback);
}
