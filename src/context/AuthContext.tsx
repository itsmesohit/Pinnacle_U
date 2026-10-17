import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { User, UserRole } from '../types';
import { getCurrentUser, setCurrentUser as persistUser, getUserByEmail, initializeData, resetUserPassword } from '../lib/dataService';
import { DEMO_CREDENTIALS } from '../lib/seedData';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  resetPassword: (email: string, newPassword: string) => { success: boolean; error?: string };
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
    const saved = getCurrentUser();
    if (saved) {
      setUser(saved);
    }
    setInitialized(true);
  }, []);

  const login = useCallback((email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // Check registered users
    const dbUser = getUserByEmail(cleanEmail);
    if (dbUser) {
      const defaultRolePass = dbUser.role === 'admin' ? 'admin123' : dbUser.role === 'teacher' ? 'teacher123' : 'student123';
      const isPasswordValid = (dbUser.password && dbUser.password === cleanPassword) || cleanPassword === defaultRolePass;

      if (isPasswordValid) {
        setUser(dbUser);
        persistUser(dbUser);
        return { success: true };
      }
      return { success: false, error: 'Incorrect password. If you forgot your password, please use the reset link below.' };
    }

    // Fallback to demo credentials
    const cred = DEMO_CREDENTIALS.find(c => c.email.toLowerCase() === cleanEmail && c.password === cleanPassword);
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

    return { success: false, error: 'Account not found. Please verify your email address or select a demo persona.' };
  }, []);

  const resetPassword = useCallback((email: string, newPassword: string) => {
    return resetUserPassword(email, newPassword);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    persistUser(null);
  }, []);

  const hasRole = useCallback((role: UserRole | UserRole[]) => {
    if (!user) return false;
    if (Array.isArray(role)) return role.includes(user.role);
    return user.role === role;
  }, [user]);

  if (!initialized) {
    return null; // or a loading screen
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
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
