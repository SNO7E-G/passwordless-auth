import { EventEmitter } from 'events';
import { User, AuthToken, TokenType } from '../interfaces';

// Define event names as constants
export const AUTH_EVENTS = {
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  LOGIN_SUCCESS: 'auth.login.success',
  LOGIN_FAILED: 'auth.login.failed',
  LOGOUT: 'auth.logout',
  TOKEN_CREATED: 'auth.token.created',
  TOKEN_VERIFIED: 'auth.token.verified',
  TOKEN_EXPIRED: 'auth.token.expired',
  TOKEN_INVALID: 'auth.token.invalid',
  MAGIC_LINK_SENT: 'auth.magicLink.sent',
  OTP_SENT: 'auth.otp.sent',
  TOTP_SETUP: 'auth.totp.setup',
  TOTP_VERIFIED: 'auth.totp.verified',
  WEBAUTHN_REGISTERED: 'auth.webauthn.registered',
  WEBAUTHN_AUTHENTICATED: 'auth.webauthn.authenticated',
  RISK_ASSESSMENT: 'auth.risk.assessment',
};

// Define event payload interfaces
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

// Extend the Node.js EventEmitter
class AuthEventEmitter extends EventEmitter {
  // Keep track of listeners
  private listenerCounts: Map<string, number> = new Map();
  
  constructor() {
    super();
    this.setMaxListeners(50); // Set higher max listeners to avoid warnings
  }
  
  /**
   * Emit an authentication event with payload
   * @param eventName Event name
   * @param payload Event payload
   * @returns True if event had listeners
   */
  emitAuthEvent(eventName: string, payload: AuthEventPayload): boolean {
    // Add timestamp if not provided
    if (!payload.timestamp) {
      payload.timestamp = new Date();
    }
    
    return this.emit(eventName, payload);
  }
  
  /**
   * Add listener with type safety
   * @param eventName Event name
   * @param listener Event listener function
   * @returns this (for chaining)
   */
  onAuth<T extends AuthEventPayload>(
    eventName: string, 
    listener: (payload: T) => void
  ): this {
    // Track listener count
    const count = this.listenerCounts.get(eventName) || 0;
    this.listenerCounts.set(eventName, count + 1);
    
    return this.on(eventName, listener);
  }
  
  /**
   * Add one-time listener with type safety
   * @param eventName Event name
   * @param listener Event listener function
   * @returns this (for chaining)
   */
  onceAuth<T extends AuthEventPayload>(
    eventName: string, 
    listener: (payload: T) => void
  ): this {
    return this.once(eventName, listener);
  }
  
  /**
   * Remove specific listener
   * @param eventName Event name
   * @param listener Event listener function
   * @returns this (for chaining)
   */
  offAuth<T extends AuthEventPayload>(
    eventName: string, 
    listener: (payload: T) => void
  ): this {
    // Track listener count
    const count = this.listenerCounts.get(eventName) || 0;
    if (count > 0) {
      this.listenerCounts.set(eventName, count - 1);
    }
    
    return this.off(eventName, listener);
  }
  
  /**
   * Remove all listeners for an event
   * @param eventName Event name (optional)
   * @returns this (for chaining)
   */
  removeAllAuthListeners(eventName?: string): this {
    if (eventName) {
      this.listenerCounts.delete(eventName);
    } else {
      this.listenerCounts.clear();
    }
    
    return this.removeAllListeners(eventName);
  }
  
  /**
   * Get number of listeners for an event
   * @param eventName Event name
   * @returns Number of listeners
   */
  listenerCount(eventName: string): number {
    return super.listenerCount(eventName);
  }
  
  /**
   * Register default listeners for logging
   * @param logger Logger instance
   */
  registerDefaultLoggers(logger: any): void {
    // Example of registering default loggers for all events
    Object.values(AUTH_EVENTS).forEach(eventName => {
      this.onAuth(eventName, (payload: AuthEventPayload) => {
        logger.debug(`Auth Event: ${eventName}`, { 
          event: eventName,
          timestamp: payload.timestamp,
          userId: payload.userId
        });
      });
    });
    
    // Add specific handlers for important events
    this.onAuth<LoginFailedEventPayload>(AUTH_EVENTS.LOGIN_FAILED, (payload) => {
      logger.warn(`Failed login attempt: ${payload.reason}`, {
        userId: payload.userId,
        email: payload.email,
        method: payload.method,
        ip: payload.ip,
        attempts: payload.attemptCount
      });
    });
    
    this.onAuth<RiskAssessmentEventPayload>(AUTH_EVENTS.RISK_ASSESSMENT, (payload) => {
      if (payload.riskScore > 70) { // High risk
        logger.warn(`High risk authentication attempt`, {
          userId: payload.userId,
          riskLevel: payload.riskLevel,
          riskScore: payload.riskScore,
          ip: payload.ip
        });
      }
    });
  }
}

// Export a singleton instance
export default new AuthEventEmitter(); 