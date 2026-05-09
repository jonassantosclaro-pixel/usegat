import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface UserData {
  uid: string;
  email: string | null;
  name: string | null;
  photoURL: string | null;
  phone?: string;
  address?: {
    cep: string;
    rua: string;
    numero: string;
    cidade: string;
    estado: string;
  };
  role: 'admin' | 'customer';
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  signUpEmail: (email: string, pass: string, name: string) => Promise<void>;
  signInEmail: (email: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserData: (data: Partial<UserData>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        const isBootstrapAdmin = currentUser.email === 'jonassantosclaro@gmail.com';
        
        let profile: any = null;

        if (!userSnap.exists()) {
          const role = isBootstrapAdmin ? 'admin' : 'customer';
          profile = {
            uid: currentUser.uid,
            name: currentUser.displayName,
            email: currentUser.email,
            photoURL: currentUser.photoURL,
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
            role: role
          };
          await setDoc(userRef, profile);
          setIsAdmin(role === 'admin');
        } else {
          profile = userSnap.data();
          let role = profile.role;
          
          if (isBootstrapAdmin && role !== 'admin') {
            role = 'admin';
            await setDoc(userRef, { role: 'admin' }, { merge: true });
          }

          setIsAdmin(role === 'admin');
          await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
        }
        setUserData(profile);
      } else {
        setUserData(null);
        setIsAdmin(false);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signUpEmail = async (email: string, pass: string, name: string) => {
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(res.user, { displayName: name });
    const userRef = doc(db, 'users', res.user.uid);
    await setDoc(userRef, {
      uid: res.user.uid,
      name,
      email,
      role: 'customer',
      createdAt: serverTimestamp(),
    });
  };

  const signInEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signOutUser = async () => {
    await signOut(auth);
  };

  const updateUserData = async (data: Partial<UserData>) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, data, { merge: true });
    const snap = await getDoc(userRef);
    if (snap.exists()) setUserData(snap.data() as UserData);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userData,
      loading, 
      isAdmin, 
      signInWithGoogle, 
      signUpEmail,
      signInEmail,
      signOut: signOutUser,
      updateUserData
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
