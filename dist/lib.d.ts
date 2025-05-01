/**
 * Passwordless Authentication Library - Core Functionality
 *
 * @copyright Copyright (c) 2024 Mahmoud Ashraf (SNO7E)
 * @license MIT
 * @version 1.0.0
 * @author Mahmoud Ashraf (SNO7E) <https://github.com/SNO7E-G>
 */
export type { User, AuthToken, Session, TokenType, MagicLinkOptions, OtpOptions, LoginOptions, AuthResponse, VerificationResult, TotpSetupResponse, WebAuthnRegistrationOptions, WebAuthnRegistrationResult, WebAuthnCredential, LogEntry } from './interfaces';
export { AUTH_EVENTS } from './utils/eventEmitter';
export type { AuthEventPayload, UserCreatedEventPayload, UserUpdatedEventPayload, LoginEventPayload, LoginFailedEventPayload, TokenEventPayload, RiskAssessmentEventPayload } from './utils/eventEmitter';
export interface OtpProvider {
    generateOtp(length: number, options: Record<string, any>): string;
    validateOtp(otp: string, secret: string, options: Record<string, any>): boolean;
}
export interface OtpServiceOptions {
    algorithm?: string;
    digits?: number;
    window?: number;
    period?: number;
    step?: number;
    addChecksum?: boolean;
    secret?: string;
    providerType?: string;
    length?: number;
    expiresIn?: number;
}
export interface I18nOptions {
    locale?: string;
    fallbackLocale?: string;
}
export interface LocaleData {
    messages: Record<string, string>;
    templates: Record<string, string>;
}
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
export interface AuthEventListener<T> {
    (payload: T): void;
}
