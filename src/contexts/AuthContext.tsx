import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  User,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  ResendVerificationRequest,
  ResendVerificationResponse,
  AllyCode,
  AllyCodeListResponse,
  AllyCodeMigrationPrompt,
} from '../types';
import { setTokens, clearTokens, isAuthenticated as checkAuth } from '../services/auth';
import { apiClient, initializeApiClient } from '../services/api';
import {
  getAllyCodesFromStorage,
  saveAllyCodeToStorage,
  removeAllyCodeFromStorage,
  updateAllyCodeLastUsed as updateLocalStorageLastUsed,
  getSelectedAllyCode,
  setSelectedAllyCode,
  clearAllyCodes,
  StoredAllyCode,
} from '../services/allyCodeStorage';

export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  forgotPassword: (data: ForgotPasswordRequest) => Promise<string>;
  resetPassword: (data: ResetPasswordRequest) => Promise<string>;
  resendVerification: (data: ResendVerificationRequest) => Promise<string>;

  // Feature flags
  authEnabled: boolean;
  isLoadingFeatures: boolean;

  // Ally code management
  allyCodes: AllyCode[] | StoredAllyCode[];
  selectedAllyCode: string | null;
  isLoadingAllyCodes: boolean;
  fetchAllyCodes: () => Promise<void>;
  addAllyCode: (allyCode: string) => Promise<void>;
  removeAllyCode: (allyCodeId: number | string) => Promise<void>;
  selectAllyCode: (allyCode: string | null) => void;
  updateAllyCodeLastUsed: (allyCodeId: number | string) => Promise<void>;
  migrationPrompt: AllyCodeMigrationPrompt;
  dismissMigrationPrompt: () => void;
  migrateLocalStorageCodes: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export interface AuthProviderProps {
  children: React.ReactNode;
  apiBaseUrl: string;
}

/**
 * AuthProvider
 * Provides authentication state and methods to the entire application
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children, apiBaseUrl }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Feature flags state
  const [authEnabled, setAuthEnabled] = useState(true); // Default to enabled
  const [isLoadingFeatures, setIsLoadingFeatures] = useState(true);

  // Ally code state
  const [allyCodes, setAllyCodes] = useState<AllyCode[] | StoredAllyCode[]>([]);
  const [selectedAllyCode, setSelectedAllyCodeState] = useState<string | null>(null);
  const [isLoadingAllyCodes, setIsLoadingAllyCodes] = useState(false);
  const [migrationPrompt, setMigrationPrompt] = useState<AllyCodeMigrationPrompt>({
    show: false,
    localStorageCodes: [],
  });

  // Initialize API client with provided base URL
  useEffect(() => {
    initializeApiClient({
      baseURL: apiBaseUrl,
    });
  }, [apiBaseUrl]);

  // Fetch feature flags from API
  useEffect(() => {
    const fetchFeatures = async () => {
      try {
        const features = await apiClient.get<{ auth_enabled: boolean }>('/api/v1/config/features');
        setAuthEnabled(features.auth_enabled);
      } catch (error) {
        console.error('Failed to fetch features:', error);
        // Default to enabled on error to avoid breaking existing functionality
        setAuthEnabled(true);
      } finally {
        setIsLoadingFeatures(false);
      }
    };

    fetchFeatures();
  }, [apiBaseUrl]);

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
    setAllyCodes([]);
    setSelectedAllyCodeState(null);
    setMigrationPrompt({ show: false, localStorageCodes: [] });
    // Note: We keep localStorage codes intact for anonymous use
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  const forgotPassword = async (data: ForgotPasswordRequest): Promise<string> => {
    try {
      const response = await apiClient.post<ForgotPasswordResponse>(
        '/api/v1/auth/forgot-password',
        data
      );
      return response.message;
    } catch (error) {
      console.error('Forgot password failed:', error);
      throw error;
    }
  };

  const resetPassword = async (data: ResetPasswordRequest): Promise<string> => {
    try {
      const response = await apiClient.post<ResetPasswordResponse>(
        '/api/v1/auth/reset-password',
        data
      );
      return response.message;
    } catch (error) {
      console.error('Reset password failed:', error);
      throw error;
    }
  };

  const resendVerification = async (data: ResendVerificationRequest): Promise<string> => {
    try {
      const response = await apiClient.post<ResendVerificationResponse>(
        '/api/v1/auth/resend-verification',
        data
      );
      return response.message;
    } catch (error) {
      console.error('Resend verification failed:', error);
      throw error;
    }
  };

  // Fetch ally codes based on auth state
  const fetchAllyCodes = useCallback(async () => {
    setIsLoadingAllyCodes(true);

    try {
      if (user) {
        // Logged-in user: fetch from API
        const response = await apiClient.get<AllyCodeListResponse>('/api/v1/users/me/ally-codes');
        setAllyCodes(response.ally_codes);

        // Check for localStorage codes to migrate
        const localCodes = getAllyCodesFromStorage();
        if (localCodes.length > 0) {
          setMigrationPrompt({
            show: true,
            localStorageCodes: localCodes.map(c => c.ally_code),
          });
        }
      } else {
        // Anonymous user: use localStorage
        const localCodes = getAllyCodesFromStorage();
        setAllyCodes(localCodes);
      }

      // Restore selected ally code
      const selected = getSelectedAllyCode();
      setSelectedAllyCodeState(selected);
    } catch (error) {
      console.error('Failed to fetch ally codes:', error);
      setAllyCodes([]);
    } finally {
      setIsLoadingAllyCodes(false);
    }
  }, [user]);

  // Add ally code
  const addAllyCode = useCallback(async (allyCode: string) => {
    // Format validation (9 digits)
    if (!/^\d{9}$/.test(allyCode)) {
      throw new Error('Ally code must be exactly 9 digits');
    }

    if (user) {
      // Logged-in: save to DB (backend validates via Comlink)
      const newAllyCode = await apiClient.post<AllyCode>(
        '/api/v1/users/me/ally-codes',
        { ally_code: allyCode }
      );

      setAllyCodes(prev => [newAllyCode, ...prev]);

      // Auto-select if it's the first one
      if (allyCodes.length === 0) {
        selectAllyCode(allyCode);
      }
    } else {
      // Anonymous: validate via player data API, then save to localStorage
      const playerData = await apiClient.get<any>(`/api/v1/player-data/player/${allyCode}`);

      if (!playerData) {
        throw new Error('Invalid ally code - player not found');
      }

      const storedCode: StoredAllyCode = {
        ally_code: allyCode,
        player_name: (playerData as any)?.data?.name || null,
        last_used_at: new Date().toISOString(),
      };

      saveAllyCodeToStorage(storedCode);
      setAllyCodes(getAllyCodesFromStorage());

      // Auto-select if it's the first one
      if (allyCodes.length === 0) {
        selectAllyCode(allyCode);
      }
    }
  }, [user, allyCodes.length]);

  // Remove ally code
  const removeAllyCode = useCallback(async (allyCodeId: number | string) => {
    if (user && typeof allyCodeId === 'number') {
      // Logged-in: delete from DB
      await apiClient.delete(`/api/v1/users/me/ally-codes/${allyCodeId}`);
      setAllyCodes(prev => prev.filter(ac => 'id' in ac && ac.id !== allyCodeId));
    } else if (!user && typeof allyCodeId === 'string') {
      // Anonymous: delete from localStorage
      removeAllyCodeFromStorage(allyCodeId);
      setAllyCodes(getAllyCodesFromStorage());

      // Clear selection if deleted code was selected
      if (selectedAllyCode === allyCodeId) {
        selectAllyCode(null);
      }
    }
  }, [user, selectedAllyCode]);

  // Select ally code
  const selectAllyCode = useCallback((allyCode: string | null) => {
    setSelectedAllyCodeState(allyCode);
    setSelectedAllyCode(allyCode);

    if (allyCode && user) {
      // Update last_used_at for authenticated users
      const code = allyCodes.find(ac => 'ally_code' in ac && ac.ally_code === allyCode);
      if (code && 'id' in code) {
        updateAllyCodeLastUsed(code.id as number);
      }
    } else if (allyCode && !user) {
      // Update localStorage for anonymous users
      updateLocalStorageLastUsed(allyCode);
    }
  }, [user, allyCodes]);

  // Update last_used_at
  const updateAllyCodeLastUsed = useCallback(async (allyCodeId: number | string) => {
    if (user && typeof allyCodeId === 'number') {
      await apiClient.put(`/api/v1/users/me/ally-codes/${allyCodeId}/use`, {});
      // Refresh list to get updated timestamp
      await fetchAllyCodes();
    } else if (!user && typeof allyCodeId === 'string') {
      updateLocalStorageLastUsed(allyCodeId);
      setAllyCodes(getAllyCodesFromStorage());
    }
  }, [user, fetchAllyCodes]);

  // Migration support
  const dismissMigrationPrompt = useCallback(() => {
    setMigrationPrompt({ show: false, localStorageCodes: [] });
  }, []);

  const migrateLocalStorageCodes = useCallback(async () => {
    if (!user) return;

    const localCodes = getAllyCodesFromStorage();

    for (const code of localCodes) {
      try {
        await addAllyCode(code.ally_code);
      } catch (error) {
        console.error(`Failed to migrate ally code ${code.ally_code}:`, error);
        // Continue with other codes even if one fails
      }
    }

    // Clear localStorage after migration
    clearAllyCodes();
    dismissMigrationPrompt();
  }, [user, addAllyCode, dismissMigrationPrompt]);

  // Load ally codes on mount and when auth state changes
  useEffect(() => {
    fetchAllyCodes();
  }, [fetchAllyCodes]);

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
    forgotPassword,
    resetPassword,
    resendVerification,

    // Feature flags
    authEnabled,
    isLoadingFeatures,

    // Ally code values
    allyCodes,
    selectedAllyCode,
    isLoadingAllyCodes,
    fetchAllyCodes,
    addAllyCode,
    removeAllyCode,
    selectAllyCode,
    updateAllyCodeLastUsed,
    migrationPrompt,
    dismissMigrationPrompt,
    migrateLocalStorageCodes,
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
