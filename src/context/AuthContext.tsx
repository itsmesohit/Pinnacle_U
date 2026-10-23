import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { User, UserRole } from '../types';
import { getCurrentUser, setCurrentUser as persistUser, getUserByEmail, initializeData, resetUserPassword } from '../lib/dataService';
import { DEMO_CREDENTIALS } from '../lib/seedData';
import { api, setAuthToken } from '../lib/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithOtp: (email: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  resetPassword: (email: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    initializeData();

    // Check token with backend if exists
    async function checkExistingAuth() {
      const saved = getCurrentUser();
      if (saved) {
        setUser(saved);
      }

      try {
        const res = await api.auth.getMe();
        if (res.success && res.user) {
          const u: User = {
            id: res.user.id,
            email: res.user.email,
            name: res.user.name,
            role: res.user.role,
            avatar: res.user.avatar,
            linkedEntityId: res.user.linkedEntityId,
          };
          setUser(u);
          persistUser(u);
        }
      } catch {
        // Offline or token expired; local saved user retained
      } finally {
        setInitialized(true);
      }
    }

    checkExistingAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // 1. Try real Backend API first
    try {
      const res = await api.auth.login(cleanEmail, cleanPassword);
      if (res.success && res.user) {
        setAuthToken(res.token);
        const loggedUser: User = {
          id: res.user.id,
          email: res.user.email,
          name: res.user.name,
          role: res.user.role,
          avatar: res.user.avatar,
          linkedEntityId: res.user.linkedEntityId,
        };
        setUser(loggedUser);
        persistUser(loggedUser);
        return { success: true };
      }
    } catch (apiErr: any) {
      // If server returned a clear 401/404, we can return its message
      if (apiErr.message && !apiErr.message.includes('fetch') && !apiErr.message.includes('status 500')) {
        // If it's bad credentials, don't fallback to demo unless demo email
        const isDemo = DEMO_CREDENTIALS.some(d => d.email.toLowerCase() === cleanEmail);
        if (!isDemo) {
          return { success: false, error: apiErr.message };
        }
      }
    }

    // 2. Fallback to registered users in local storage / demo personas
    const dbUser = getUserByEmail(cleanEmail);
    if (dbUser) {
      const defaultRolePass = dbUser.role === 'admin' ? 'admin123' : dbUser.role === 'teacher' ? 'teacher123' : 'student123';
      const isPasswordValid = (dbUser.password && dbUser.password === cleanPassword) || cleanPassword === defaultRolePass;

      if (isPasswordValid) {
        setUser(dbUser);
        persistUser(dbUser);
        return { success: true };
      }
      return { success: false, error: 'Incorrect password. If you forgot your password, please use the OTP reset link.' };
    }

    // Demo credentials match
    const cred = DEMO_CREDENTIALS.find(c => c.email.toLowerCase() === cleanEmail && (c.password === cleanPassword || cleanPassword === `${c.role}123`));
    if (cred) {
      const fallbackUser: User = {
        id: `user-${cred.role}`,
        email: cred.email,
        name: cred.name,
        role: cred.role,
      };
      setUser(fallbackUser);
      persistUser(fallbackUser);
      return { success: true };
    }

    return { success: false, error: 'Account not found. Please verify your email or register a new student account.' };
  }, []);

  const loginWithOtp = useCallback(async (email: string, otp: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    try {
      const res = await api.auth.verifyLoginOtp({ email: cleanEmail, otp: cleanOtp });
      if (res.success && res.user) {
        setAuthToken(res.token);
        const loggedUser: User = {
          id: res.user.id,
          email: res.user.email,
          name: res.user.name,
          role: res.user.role,
          avatar: res.user.avatar,
          linkedEntityId: res.user.linkedEntityId,
        };
        setUser(loggedUser);
        persistUser(loggedUser);
        return { success: true };
      }
      return { success: false, error: 'OTP verification failed' };
    } catch (apiErr: any) {
      return { success: false, error: apiErr.message || 'OTP verification failed' };
    }
  }, []);

  const resetPassword = useCallback(async (email: string, newPassword: string) => {
    // Sync to local data service
    return resetUserPassword(email, newPassword);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    persistUser(null);
    setAuthToken(null);
  }, []);

  const hasRole = useCallback((role: UserRole | UserRole[]) => {
    if (!user) return false;
    if (Array.isArray(role)) return role.includes(user.role);
    return user.role === role;
  }, [user]);

  if (!initialized) {
    return null;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        loginWithOtp,
        logout,
        resetPassword,
        hasRole,
        isAdmin: user?.role === 'admin',
        isTeacher: user?.role === 'teacher',
        isStudent: user?.role === 'student',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
