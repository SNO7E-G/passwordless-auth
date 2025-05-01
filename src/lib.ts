/**
 * Passwordless Authentication Library - Core Functionality
 * 
 * @copyright Copyright (c) 2024 Mahmoud Ashraf (SNO7E)
 * @license MIT
 * @version 1.0.0
 * @author Mahmoud Ashraf (SNO7E) <https://github.com/SNO7E-G>
 */

// Re-export interfaces
export type {
  User,
  AuthToken,
  Session,
  TokenType,
  MagicLinkOptions,
  OtpOptions,
  LoginOptions,
  AuthResponse,
  VerificationResult,
  TotpSetupResponse,
  WebAuthnRegistrationOptions,
  WebAuthnRegistrationResult,
  WebAuthnCredential,
  LogEntry
} from './interfaces';

// Re-export event types
export { AUTH_EVENTS } from './utils/eventEmitter';
export type {
  AuthEventPayload,
  UserCreatedEventPayload,
  UserUpdatedEventPayload,
  LoginEventPayload,
  LoginFailedEventPayload,
  TokenEventPayload,
  RiskAssessmentEventPayload
} from './utils/eventEmitter';

// Export OTP related interfaces from OTP Service
export interface OtpProvider {
  generateOtp(length: number, options: Record<string, any>): string;
  validateOtp(otp: string, secret: string, options: Record<string, any>): boolean;
}

// OTP options with more specific definition
export interface OtpServiceOptions {
  algorithm?: string; // 'sha1', 'sha256', 'sha512'
  digits?: number;    // Number of digits in the OTP
  window?: number;    // Time window for TOTP in seconds
  period?: number;    // TOTP period in seconds (default 30)
  step?: number;      // Step count for HOTP
  addChecksum?: boolean; // Add checksum digit
  secret?: string;    // Secret for OTP generation
  providerType?: string;
  length?: number;
  expiresIn?: number;
}

// Re-export i18n interfaces
export interface I18nOptions {
  locale?: string;
  fallbackLocale?: string;
}

export interface LocaleData {
  messages: Record<string, string>;
  templates: Record<string, string>;
}

// Re-export storage interfaces
export interface StorageAdapter {
  findUserById(id: string): Promise<any>;
  findUserByEmail(email: string): Promise<any>;
  findUserByPhone(phone: string): Promise<any>;
  createUser(userData: any): Promise<any>;
  updateUser(id: string, updates: any): Promise<any>;
  findTokenById(id: string): Promise<any>;
  findTokenByToken(token: string): Promise<any>;
  createToken(tokenData: any): Promise<any>;
  updateToken(id: string, updates: any): Promise<any>;
  findSessionById(id: string): Promise<any>;
  findSessionByToken(token: string): Promise<any>;
  createSession(sessionData: any): Promise<any>;
  updateSession(id: string, updates: any): Promise<any>;
  deleteSession(id: string): Promise<boolean>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}

// Export additional service interfaces to ensure all private types are properly exported
export interface EmailServiceOptions {
  host?: string;
  port?: number;
  secure?: boolean;
  auth?: {
    user: string;
    pass: string;
  };
  from?: string;
  templateDir?: string;
}

export interface SmsServiceOptions {
  provider?: string;
  accountSid?: string;
  authToken?: string;
  phoneNumber?: string;
}

// Export event emitter related types
export interface AuthEventListener<T> {
  (payload: T): void;
} 