import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api, getAuthToken, setAuthToken } from '../services/api';

interface AuthContextType {
  currentUser: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isCheckingAuth: boolean;
  login: (id: string, password?: string, preferredRole?: UserRole) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  changePassword: (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ) => Promise<{ success: boolean; error?: string; message?: string }>;
  updateCurrentUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_AUTH_USER_KEY = 'campus_care_auth_user_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_AUTH_USER_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);

  const role = currentUser ? currentUser.role : null;
  const isAuthenticated = !!currentUser;

  // Persist or remove user profile in local storage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_AUTH_USER_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_AUTH_USER_KEY);
    }
  }, [currentUser]);

  // Verify server session on initial load / page refresh
  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      const token = getAuthToken();
      if (!token) {
        if (isMounted) {
          setCurrentUser(null);
          setIsCheckingAuth(false);
        }
        return;
      }

      try {
        const verifiedUser = await api.getMe();
        if (isMounted) {
          if (verifiedUser) {
            setCurrentUser(verifiedUser);
          } else {
            // Token expired or invalid on server
            setCurrentUser(null);
            setAuthToken(null);
          }
        }
      } catch (err) {
        console.warn('Session verification error on refresh:', err);
        if (isMounted) {
          setCurrentUser(null);
          setAuthToken(null);
        }
      } finally {
        if (isMounted) {
          setIsCheckingAuth(false);
        }
      }
    };

    verifySession();

    // Listen for unauthorized 401 events from API layer
    const handleUnauthorized = () => {
      setCurrentUser(null);
      setAuthToken(null);
      localStorage.removeItem(STORAGE_AUTH_USER_KEY);
    };

    window.addEventListener('campuscare:unauthorized', handleUnauthorized);
    return () => {
      isMounted = false;
      window.removeEventListener('campuscare:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (
    id: string,
    password?: string,
    preferredRole?: UserRole
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await api.login(id, password, preferredRole);
      if (res.success && res.user) {
        setCurrentUser(res.user);
        return { success: true };
      }
      return { success: false, error: 'Invalid identification credentials.' };
    } catch (e: any) {
      console.error('Login error:', e?.message);
      return {
        success: false,
        error: e?.message || 'Authentication failed. Please verify your credentials.',
      };
    }
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<{ success: boolean; error?: string; message?: string }> => {
    try {
      const res = await api.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (res.success) {
        if (currentUser) {
          const updated = {
            ...currentUser,
            mustChangePassword: false,
          };
          setCurrentUser(updated);
        }
        return { success: true, message: res.message || 'Password changed successfully.' };
      }
      return { success: false, error: 'Failed to update password.' };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Error updating password.' };
    }
  };

  const updateCurrentUser = (user: User) => {
    setCurrentUser(user);
  };

  const logout = async (): Promise<void> => {
    try {
      await api.logout();
    } catch (e) {
      console.error('Logout error', e);
    } finally {
      setCurrentUser(null);
      setAuthToken(null);
      localStorage.removeItem(STORAGE_AUTH_USER_KEY);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        isAuthenticated,
        isCheckingAuth,
        login,
        logout,
        changePassword,
        updateCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
