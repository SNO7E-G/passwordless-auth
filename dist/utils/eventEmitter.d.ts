import { EventEmitter } from 'events';
import { User, TokenType } from '../interfaces';
export declare const AUTH_EVENTS: {
    USER_CREATED: string;
    USER_UPDATED: string;
    LOGIN_SUCCESS: string;
    LOGIN_FAILED: string;
    LOGOUT: string;
    TOKEN_CREATED: string;
    TOKEN_VERIFIED: string;
    TOKEN_EXPIRED: string;
    TOKEN_INVALID: string;
    MAGIC_LINK_SENT: string;
    OTP_SENT: string;
    TOTP_SETUP: string;
    TOTP_VERIFIED: string;
    WEBAUTHN_REGISTERED: string;
    WEBAUTHN_AUTHENTICATED: string;
    RISK_ASSESSMENT: string;
};
export interface AuthEventPayload {
    timestamp: Date;
    userId?: string;
    ip?: string;
    userAgent?: string;
}
export interface UserCreatedEventPayload extends AuthEventPayload {
    user: User;
}
export interface UserUpdatedEventPayload extends AuthEventPayload {
    user: User;
    changes: Partial<User>;
}
export interface LoginEventPayload extends AuthEventPayload {
    user: User;
    method: string;
    deviceInfo?: object;
}
export interface LoginFailedEventPayload extends AuthEventPayload {
    reason: string;
    email?: string;
    phone?: string;
    method: string;
    attemptCount?: number;
}
export interface TokenEventPayload extends AuthEventPayload {
    tokenId: string;
    tokenType: TokenType;
    userId: string;
}
export interface RiskAssessmentEventPayload extends AuthEventPayload {
    userId: string;
    riskLevel: string;
    riskScore: number;
    factors: object;
}
declare class AuthEventEmitter extends EventEmitter {
    private listenerCounts;
    constructor();
    /**
     * Emit an authentication event with payload
     * @param eventName Event name
     * @param payload Event payload
     * @returns True if event had listeners
     */
    emitAuthEvent(eventName: string, payload: AuthEventPayload): boolean;
    /**
     * Add listener with type safety
     * @param eventName Event name
     * @param listener Event listener function
     * @returns this (for chaining)
     */
    onAuth<T extends AuthEventPayload>(eventName: string, listener: (payload: T) => void): this;
    /**
     * Add one-time listener with type safety
     * @param eventName Event name
     * @param listener Event listener function
     * @returns this (for chaining)
     */
    onceAuth<T extends AuthEventPayload>(eventName: string, listener: (payload: T) => void): this;
    /**
     * Remove specific listener
     * @param eventName Event name
     * @param listener Event listener function
     * @returns this (for chaining)
     */
    offAuth<T extends AuthEventPayload>(eventName: string, listener: (payload: T) => void): this;
    /**
     * Remove all listeners for an event
     * @param eventName Event name (optional)
     * @returns this (for chaining)
     */
    removeAllAuthListeners(eventName?: string): this;
    /**
     * Get number of listeners for an event
     * @param eventName Event name
     * @returns Number of listeners
     */
    listenerCount(eventName: string): number;
    /**
     * Register default listeners for logging
     * @param logger Logger instance
     */
    registerDefaultLoggers(logger: any): void;
}
declare const _default: AuthEventEmitter;
export default _default;
