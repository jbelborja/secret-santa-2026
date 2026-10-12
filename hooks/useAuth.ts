import { useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { onSnapshot } from 'firebase/firestore';
import { auth } from '../lib/firebase';
import { userDoc } from '../lib/firestore';
import { syncUserDocument } from '../lib/auth';
import { User } from '../types';

export function useAuth() {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeUserDoc: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);

      if (fbUser) {
        try {
          // Listen to real-time updates on the user's Firestore profile
          const docRef = userDoc(fbUser.uid);
          unsubscribeUserDoc = onSnapshot(
            docRef,
            (snap) => {
              if (snap.exists()) {
                setUser(snap.data());
              } else {
                // If doc doesn't exist yet, sync it
                syncUserDocument(fbUser).then((createdUser) => {
                  setUser(createdUser);
                });
              }
              setLoading(false);
            },
            (error) => {
              console.warn('Error listening to user document:', error);
              setLoading(false);
            }
          );
        } catch (err) {
          console.warn('Error initializing user doc listener:', err);
          setLoading(false);
        }
      } else {
        if (unsubscribeUserDoc) {
          unsubscribeUserDoc();
        }
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
      }
    };
  }, []);

  return {
    user,
    firebaseUser,
    loading,
    isAuthenticated: Boolean(user),
  };
}

export default useAuth;
