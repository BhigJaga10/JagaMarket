import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, VendorProfile, UserRole } from '../types';
import { db } from '../services/db';

interface AuthContextType {
  currentUser: User | null;
  currentVendorProfile: VendorProfile | null;
  isAuthenticated: boolean;
  role: UserRole | null;
  login: (email: string, role?: UserRole) => { success: boolean; error?: string };
  logout: () => void;
  registerCustomer: (data: {
    fullName: string;
    email: string;
    phone: string;
    street?: string;
    city?: string;
    state?: string;
  }) => { success: boolean; error?: string };
  registerVendor: (data: {
    businessName: string;
    ownerName: string;
    email: string;
    phone: string;
    businessAddress: string;
    state: string;
    lga: string;
    category: string;
    cacNumber?: string;
    tinNumber?: string;
    kycDocuments: {
      cacCertificateUrl?: string;
      utilityBillUrl?: string;
      governmentIdUrl?: string;
      idType?: string;
    };
  }) => { success: boolean; error?: string };
  switchUserFast: (userId: string) => void;
  refreshUserData: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CURRENT_USER_ID_KEY = 'jaga_current_user_id_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentVendorProfile, setCurrentVendorProfile] = useState<VendorProfile | null>(null);

  const loadUser = (userId: string | null) => {
    if (!userId) {
      setCurrentUser(null);
      setCurrentVendorProfile(null);
      return;
    }
    const user = db.getUserById(userId);
    if (user) {
      setCurrentUser(user);
      if (user.role === 'vendor') {
        const vProfile = db.getVendorByUserId(user.id);
        setCurrentVendorProfile(vProfile || null);
      } else {
        setCurrentVendorProfile(null);
      }
    } else {
      setCurrentUser(null);
      setCurrentVendorProfile(null);
      localStorage.removeItem(CURRENT_USER_ID_KEY);
    }
  };

  useEffect(() => {
    const savedUserId = localStorage.getItem(CURRENT_USER_ID_KEY);
    // If no saved user, default to demo customer for immediate pleasant exploration,
    // or allow guest visitor browsing!
    if (savedUserId) {
      loadUser(savedUserId);
    } else {
      // Start as visitor (null) so visitor features and checkout login prompt can be verified,
      // but with 1-click test fill ready everywhere!
      loadUser(null);
    }
  }, []);

  const login = (email: string, expectedRole?: UserRole) => {
    const user = db.getUserByEmail(email);
    if (!user) {
      return { success: false, error: 'No account found with this email address.' };
    }
    if (expectedRole && user.role !== expectedRole) {
      return {
        success: false,
        error: `This account is registered as a ${user.role}. Please log in via the ${user.role} tab.`
      };
    }
    localStorage.setItem(CURRENT_USER_ID_KEY, user.id);
    loadUser(user.id);
    return { success: true };
  };

  const logout = () => {
    localStorage.removeItem(CURRENT_USER_ID_KEY);
    setCurrentUser(null);
    setCurrentVendorProfile(null);
  };

  const registerCustomer = (data: {
    fullName: string;
    email: string;
    phone: string;
    street?: string;
    city?: string;
    state?: string;
  }) => {
    const existing = db.getUserByEmail(data.email);
    if (existing) {
      return { success: false, error: 'An account with this email already exists.' };
    }

    const newUser = db.createUser({
      role: 'customer',
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      address: data.street
        ? {
            street: data.street,
            city: data.city || 'Lagos',
            state: data.state || 'Lagos'
          }
        : undefined
    });

    localStorage.setItem(CURRENT_USER_ID_KEY, newUser.id);
    loadUser(newUser.id);
    return { success: true };
  };

  const registerVendor = (data: {
    businessName: string;
    ownerName: string;
    email: string;
    phone: string;
    businessAddress: string;
    state: string;
    lga: string;
    category: string;
    cacNumber?: string;
    tinNumber?: string;
    kycDocuments: {
      cacCertificateUrl?: string;
      utilityBillUrl?: string;
      governmentIdUrl?: string;
      idType?: string;
    };
  }) => {
    const existing = db.getUserByEmail(data.email);
    if (existing) {
      return { success: false, error: 'An account with this email already exists.' };
    }

    // Create user record
    const newUser = db.createUser({
      role: 'vendor',
      fullName: data.ownerName,
      email: data.email,
      phone: data.phone,
      address: {
        street: data.businessAddress,
        city: data.lga,
        state: data.state,
        lga: data.lga
      }
    });

    // Create vendor profile with 'pending' status
    const newVendorProfile = db.createVendorProfile({
      userId: newUser.id,
      businessName: data.businessName,
      ownerName: data.ownerName,
      email: data.email,
      phone: data.phone,
      businessAddress: data.businessAddress,
      state: data.state,
      lga: data.lga,
      category: data.category,
      cacNumber: data.cacNumber,
      tinNumber: data.tinNumber,
      kycDocuments: data.kycDocuments
    });

    localStorage.setItem(CURRENT_USER_ID_KEY, newUser.id);
    setCurrentUser(newUser);
    setCurrentVendorProfile(newVendorProfile);
    return { success: true };
  };

  const switchUserFast = (userId: string) => {
    localStorage.setItem(CURRENT_USER_ID_KEY, userId);
    loadUser(userId);
  };

  const refreshUserData = () => {
    if (currentUser) {
      loadUser(currentUser.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentVendorProfile,
        isAuthenticated: !!currentUser,
        role: currentUser ? currentUser.role : null,
        login,
        logout,
        registerCustomer,
        registerVendor,
        switchUserFast,
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
