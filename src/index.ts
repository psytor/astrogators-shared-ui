/**
 * Main export file for @psytor/astrogators-shared-ui
 * Shared UI components and utilities for Astrogator's Table applications
 */

// Styles (must be imported by consuming applications)
import './styles/global.css';

// Layout Components
export { Container, TopBar, Footer } from './components/layout';
export type { ContainerProps, TopBarProps, FooterProps } from './components/layout';

// Form Components
export { Button, Input, Select, AllyCodeDropdown } from './components/forms';
export type { ButtonProps, InputProps, SelectProps, SelectOption, AllyCodeDropdownProps } from './components/forms';

// Display Components
export { Card, Badge, Modal } from './components/display';
export type { CardProps, BadgeProps, ModalProps } from './components/display';

// Feedback Components
export { Loader } from './components/feedback';
export type { LoaderProps } from './components/feedback';

// Contexts and Hooks
export { AuthProvider, useAuth } from './contexts/AuthContext';
export type { AuthContextValue, AuthProviderProps } from './contexts/AuthContext';

// Services
export { ApiClient, apiClient, initializeApiClient } from './services/api';
export type { ApiClientConfig } from './services/api';

export {
  getAccessToken,
  setAccessToken,
  removeAccessToken,
  getRefreshToken,
  setRefreshToken,
  removeRefreshToken,
  setTokens,
  clearTokens,
  isAuthenticated,
} from './services/auth';

export {
  getAllyCodesFromStorage,
  saveAllyCodeToStorage,
  removeAllyCodeFromStorage,
  updateAllyCodeLastUsed,
  getSelectedAllyCode,
  setSelectedAllyCode,
  clearAllyCodes,
} from './services/allyCodeStorage';
export type { StoredAllyCode } from './services/allyCodeStorage';

// Utils
export { formatAllyCode, unformatAllyCode } from './utils/formatAllyCode';

// Types
export type {
  User,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  VerifyEmailRequest,
  VerifyEmailResponse,
  ResendVerificationRequest,
  ResendVerificationResponse,
  AllyCode,
  AllyCodeCreate,
  AllyCodeListResponse,
  AllyCodeMigrationPrompt,
  ApiResponse,
  ApiError,
  PaginatedResponse,
  ModStat,
  ParsedMod,
  ModListResponse,
  EvaluationScores,
  ModEvaluation,
  EvaluationRequest,
  EvaluationResponse,
} from './types';
