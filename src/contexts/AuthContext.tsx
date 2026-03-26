import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot, setDoc, serverTimestamp, updateDoc, getDoc } from 'firebase/firestore';
import { addDays, isSameDay, subDays, isAfter } from 'date-fns';

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  isPro: boolean;
  streak: number;
  nexCoins: number;
  level: string;
  persona: 'school' | 'govt';
  role?: 'admin' | 'user';
  referralCode: string;
  referredBy: string | null;
  referralCount: number;
  successfulReferrals: number;
  lastActive: any;
  trialEndsAt: any;
  subscriptionEndsAt: any;
  createdAt: any;
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, profile: null, loading: true });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Capture referral code from URL
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref) {
      localStorage.setItem('referredBy', ref);
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        
        // Initial check and streak update - don't block the main flow
        getDoc(userRef).then(async (userSnap) => {
          if (userSnap.exists()) {
            const data = userSnap.data() as UserProfile;
            const now = new Date();
            const lastActive = data.lastActive?.toDate() || new Date(0);
            
            let newStreak = data.streak || 0;
            if (isSameDay(lastActive, subDays(now, 1))) {
              newStreak += 1;
            } else if (!isSameDay(lastActive, now)) {
              newStreak = 1;
            }
            
            await updateDoc(userRef, {
              lastActive: serverTimestamp(),
              streak: newStreak
            });
          } else {
            // Create initial profile with 7-day trial + 1-day grace
            const trialEndsAt = addDays(new Date(), 8); 
            const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            const urlParams = new URLSearchParams(window.location.search);
            const referredBy = urlParams.get('ref') || localStorage.getItem('referredBy');

            const initialProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'Student',
              photoURL: firebaseUser.photoURL || '',
              isPro: false,
              streak: 1,
              nexCoins: 0,
              level: 'Aspirant',
              persona: 'govt',
              referralCode,
              referredBy: referredBy || null,
              referralCount: 0,
              successfulReferrals: 0,
              lastActive: serverTimestamp(),
              trialEndsAt: trialEndsAt,
              subscriptionEndsAt: null,
              createdAt: serverTimestamp(),
            };
            await setDoc(userRef, initialProfile);
          }
        }).catch(err => console.error("Error fetching/updating profile:", err));

        const unsubProfile = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
            setLoading(false);
          }
        });
        return () => unsubProfile();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
