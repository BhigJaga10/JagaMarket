import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, VendorProfile, UserRole, VendorApplication } from '../types';
import { db } from '../services/db';
import { auth, db as firestoreDb } from '../firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';

interface AuthContextType {
  currentUser: User | null;
  currentVendorProfile: VendorProfile | null;
  vendorApplication: VendorApplication | null;
  isApprovedVendor: boolean;
  activePortal: 'customer' | 'vendor' | 'admin';
  setActivePortal: (portal: 'customer' | 'vendor' | 'admin') => void;
  isAuthenticated: boolean;
  role: UserRole | null;
  firebaseAuthReady: boolean;
  firebaseUser: FirebaseUser | null;
  login: (email: string, password?: string, expectedRole?: UserRole) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  registerCustomer: (data: {
    fullName: string;
    email: string;
    phone: string;
    password?: string;
    street?: string;
    city?: string;
    state?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentVendorProfile, setCurrentVendorProfile] = useState<VendorProfile | null>(null);
  const [vendorApplication, setVendorApplication] = useState<VendorApplication | null>(null);
  const [isApprovedVendor, setIsApprovedVendor] = useState<boolean>(false);
  const [activePortal, setActivePortal] = useState<'customer' | 'vendor' | 'admin'>('customer');
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [firebaseAuthReady, setFirebaseAuthReady] = useState(false);

  // Helper to load user profile from Firestore by Firebase UID
  const loadUserProfile = async (fbUser: FirebaseUser | null): Promise<void> => {
    if (!fbUser) {
      setCurrentUser(null);
      setCurrentVendorProfile(null);
      setVendorApplication(null);
      setIsApprovedVendor(false);
      setFirebaseUser(null);
      setActivePortal('customer');
      return;
    }

    setFirebaseUser(fbUser);

    try {
      const userRef = doc(firestoreDb, 'users', fbUser.uid);
      const userSnap = await getDoc(userRef);

      const isTargetSuperAdmin =
        fbUser.email === 'sadiqmuhammadibrahim1436@gmail.com' ||
        fbUser.email === 'admin@jaga.ng';

      let userProfile: User;

      if (userSnap.exists()) {
        userProfile = userSnap.data() as User;
        userProfile.id = fbUser.uid; // Ensure UID integrity

        // Securely ensure target admin is authorized in admins collection
        if (isTargetSuperAdmin) {
          await db.ensureAdminAuthorization({
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName
          });
          userProfile.role = 'admin';
        }
      } else {
        // Bootstrap new user record in Firestore - ALWAYS CUSTOMER-FIRST
        const role: UserRole = isTargetSuperAdmin ? 'admin' : 'customer';

        if (isTargetSuperAdmin) {
          await db.ensureAdminAuthorization({
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName
          });
        }

        userProfile = {
          id: fbUser.uid,
          userId: fbUser.uid,
          role,
          fullName: fbUser.displayName || fbUser.email?.split('@')[0] || 'JAGA Customer',
          email: fbUser.email || '',
          phone: fbUser.phoneNumber || '+234 800 000 0000',
          createdAt: new Date().toISOString()
        } as User;

        await setDoc(userRef, {
          userId: fbUser.uid,
          role,
          fullName: userProfile.fullName,
          email: userProfile.email,
          phone: userProfile.phone,
          createdAt: userProfile.createdAt
        });
      }

      // Check Vendor Application from Firestore
      const app = await db.getVendorApplication(fbUser.uid);
      setVendorApplication(app);

      // Verify whether vendor access is approved
      const hasApprovedApplication = app?.status === 'approved';
      let approvedVendorProfile: VendorProfile | null = null;

      // Also check vendors collection
      const vQuery = query(collection(firestoreDb, 'vendors'), where('userId', '==', fbUser.uid));
      const vSnap = await getDocs(vQuery);
      if (!vSnap.empty) {
        const vData = vSnap.docs[0].data() as VendorProfile;
        if (vData.kycStatus === 'approved') {
          approvedVendorProfile = vData;
        }
      }

      const approved = (hasApprovedApplication || !!approvedVendorProfile) && app?.status !== 'suspended';
      setIsApprovedVendor(approved);
      setCurrentVendorProfile(approvedVendorProfile);

      // If user profile role is set to vendor, but application is NOT approved (e.g. pending/suspended/rejected),
      // downgrade active role to 'customer' so protected vendor operations are blocked!
      if (userProfile.role === 'vendor' && !approved) {
        userProfile.role = 'customer';
      }

      setCurrentUser(userProfile);

      // Set active portal
      if (userProfile.role === 'admin') {
        setActivePortal('admin');
      } else if (approved) {
        setActivePortal('vendor');
      } else {
        setActivePortal('customer');
      }
    } catch (err) {
      console.error('Error fetching user profile from Firestore:', err);
      const isTargetSuperAdmin = fbUser.email === 'sadiqmuhammadibrahim1436@gmail.com';
      setCurrentUser({
        id: fbUser.uid,
        fullName: fbUser.displayName || fbUser.email?.split('@')[0] || 'JAGA Customer',
        email: fbUser.email || '',
        phone: fbUser.phoneNumber || '+234 800 000 0000',
        role: isTargetSuperAdmin ? 'admin' : 'customer',
        createdAt: new Date().toISOString()
      });
      setCurrentVendorProfile(null);
      setVendorApplication(null);
      setIsApprovedVendor(false);
      setActivePortal(isTargetSuperAdmin ? 'admin' : 'customer');
    }
  };

  useEffect(() => {
    // Listen to REAL Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseAuthReady(true);
      if (fbUser) {
        await loadUserProfile(fbUser);
      } else {
        setCurrentUser(null);
        setCurrentVendorProfile(null);
        setFirebaseUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (
    email: string,
    password?: string,
    expectedRole?: UserRole
  ): Promise<{ success: boolean; error?: string }> => {
    if (!password) {
      return {
        success: false,
        error: 'Password is required to sign in with your email address.'
      };
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const fbUser = userCredential.user;

      await loadUserProfile(fbUser);

      // Validate expected role if portal-specific
      if (expectedRole) {
        const userRef = doc(firestoreDb, 'users', fbUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const profile = userSnap.data() as User;
          if (profile.role !== expectedRole) {
            return {
              success: true, // Login succeeded, but inform portal difference
              error: undefined
            };
          }
        }
      }

      return { success: true };
    } catch (fbErr: any) {
      console.warn('Firebase Auth login error code:', fbErr.code);

      if (fbErr.code === 'auth/operation-not-allowed') {
        return {
          success: false,
          error:
            'Email/Password sign-in is not enabled in your Firebase Console yet. Please enable Email/Password under Authentication > Sign-in method, or sign in instantly with "Sign in with Google".'
        };
      }
      if (fbErr.code === 'auth/user-not-found' || fbErr.code === 'auth/invalid-credential' || fbErr.code === 'auth/wrong-password') {
        return {
          success: false,
          error: 'Invalid email or password. Please verify your credentials or register a new account.'
        };
      }
      if (fbErr.code === 'auth/too-many-requests') {
        return {
          success: false,
          error: 'Too many unsuccessful attempts. Access is temporarily paused by Firebase. Please try again in a few minutes.'
        };
      }

      return {
        success: false,
        error: fbErr.message || 'Authentication failed. Please check your credentials.'
      };
    }
  };

  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        await loadUserProfile(result.user);
        return { success: true };
      }
      return { success: false, error: 'Google sign in was cancelled.' };
    } catch (err: any) {
      console.error('Firebase Google Sign-In error:', err);
      return {
        success: false,
        error: err.message || 'Google sign in failed. Please ensure popups are allowed.'
      };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.warn('Firebase signout warning:', e);
    }
    setCurrentUser(null);
    setCurrentVendorProfile(null);
    setFirebaseUser(null);
  };

  const registerCustomer = async (data: {
    fullName: string;
    email: string;
    phone: string;
    password?: string;
    street?: string;
    city?: string;
    state?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    if (!data.password || data.password.length < 6) {
      return {
        success: false,
        error: 'Password must be at least 6 characters.'
      };
    }

    try {
      // 1. Create user in Firebase Authentication
      const cred = await createUserWithEmailAndPassword(auth, data.email.trim(), data.password);
      const uid = cred.user.uid;

      // 2. Save customer record in Firestore
      const newUser: User = {
        id: uid,
        userId: uid,
        role: 'customer',
        fullName: data.fullName,
        email: data.email.trim(),
        phone: data.phone,
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(firestoreDb, 'users', uid), {
        userId: uid,
        role: 'customer',
        fullName: data.fullName,
        email: data.email.trim(),
        phone: data.phone,
        createdAt: newUser.createdAt
      });

      if (data.street) {
        // PII isolated in /users/{userId}/private/info
        await setDoc(doc(firestoreDb, `users/${uid}/private`, 'info'), {
          street: data.street,
          city: data.city || 'Lagos',
          state: data.state || 'Lagos'
        });
      }

      await loadUserProfile(cred.user);
      return { success: true };
    } catch (err: any) {
      console.error('Firebase Auth register customer error:', err);
      if (err.code === 'auth/operation-not-allowed') {
        return {
          success: false,
          error:
            'Email/Password sign-up is not yet enabled in your Firebase Console. Please enable Email/Password under Authentication > Sign-in method, or sign in with Google.'
        };
      }
      if (err.code === 'auth/email-already-in-use') {
        return {
          success: false,
          error: 'An account with this email address already exists. Please sign in instead.'
        };
      }
      return {
        success: false,
        error: err.message || 'Registration failed.'
      };
    }
  };

  const refreshUserData = async (): Promise<void> => {
    if (auth.currentUser) {
      await loadUserProfile(auth.currentUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentVendorProfile,
        vendorApplication,
        isApprovedVendor,
        activePortal,
        setActivePortal,
        isAuthenticated: !!currentUser && !!firebaseUser,
        role: currentUser ? currentUser.role : null,
        firebaseAuthReady,
        firebaseUser,
        login,
        loginWithGoogle,
        logout,
        registerCustomer,
        refreshUserData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
