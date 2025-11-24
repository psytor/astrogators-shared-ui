import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from '../types';
import { setTokens, clearTokens, isAuthenticated as checkAuth } from '../services/auth';
import { apiClient } from '../services/api';

export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * AuthProvider
 * Provides authentication state and methods to the entire application
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch current user from API
  const fetchUser = useCallback(async () => {
    if (!checkAuth()) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const userData = await apiClient.get<User>('/api/v1/users/me');
      setUser(userData);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setUser(null);
      clearTokens();
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load user on mount
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (credentials: LoginRequest) => {
    try {
      const response = await apiClient.post<LoginResponse>('/api/v1/auth/login', credentials);
      setTokens(response.access_token, response.refresh_token);
      // Fetch user data after setting tokens
      const userData = await apiClient.get<User>('/api/v1/users/me');
      setUser(userData);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (data: RegisterRequest) => {
    try {
      await apiClient.post<RegisterResponse>('/api/v1/auth/register', data);
      // Note: Registration requires email verification, so don't auto-login
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = () => {
    clearTokens();
    setUser(null);
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * useAuth hook
 * Access authentication state and methods
 */
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
