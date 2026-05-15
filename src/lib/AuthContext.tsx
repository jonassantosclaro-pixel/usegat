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
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';

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

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let unsubscribeUser: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        
        // Use onSnapshot for real-time user data
        unsubscribeUser = onSnapshot(userRef, async (docSnap) => {
          const isBootstrapAdmin = currentUser.email === 'jonassantosclaro@gmail.com';
          
          if (!docSnap.exists()) {
            const role = isBootstrapAdmin ? 'admin' : 'customer';
            const profile = {
              uid: currentUser.uid,
              name: currentUser.displayName || 'Novo Usuário',
              email: currentUser.email,
              photoURL: currentUser.photoURL,
              createdAt: serverTimestamp(),
              lastLogin: serverTimestamp(),
              role: role
            };
            try {
              await setDoc(userRef, profile);
            } catch (error) {
              handleFirestoreError(error, OperationType.CREATE, `users/${currentUser.uid}`);
            }
            setUserData(profile as UserData);
            setIsAdmin(role === 'admin');
          } else {
            const data = docSnap.data() as UserData;
            let role = data.role;
            
            if (isBootstrapAdmin && role !== 'admin') {
              role = 'admin';
              try {
                await setDoc(userRef, { role: 'admin' }, { merge: true });
              } catch (error) {
                handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.uid}`);
              }
            }

            setIsAdmin(role === 'admin');
            setUserData(data);
          }
        }, (error) => {
          console.error("User data subscription error:", error);
          if (error.message.includes('permission-denied')) {
             handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
          }
        });

        // Always update last login
        try {
          await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
        } catch (error) {
          // Ignore lastLogin update errors during init if it fails
          console.warn("Failed to update last login", error);
        }
      } else {
        if (unsubscribeUser) unsubscribeUser();
        setUserData(null);
        setIsAdmin(false);
      }
      
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUser) unsubscribeUser();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      // Ensure cross-origin setting is correct for popups if possible, 
      // but usually standard is enough.
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Google Login Error:", error);
      if (error.code === 'auth/popup-blocked') {
        alert("O bloqueador de pop-ups impediu o login. Por favor, autorize pop-ups para este site ou abra o site em uma nova aba.");
      } else {
        alert("Erro ao entrar com Google: " + error.message);
      }
    }
  };

  const signUpEmail = async (email: string, pass: string, name: string) => {
    try {
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(res.user, { displayName: name });
      // The onSnapshot in our useEffect will handle creating the Firestore document
      // using the updated displayName.
    } catch (error: any) {
      console.error("SignUp error:", error);
      throw error;
    }
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
