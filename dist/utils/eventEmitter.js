"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AUTH_EVENTS = void 0;
const events_1 = require("events");
// Define event names as constants
exports.AUTH_EVENTS = {
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
// Extend the Node.js EventEmitter
class AuthEventEmitter extends events_1.EventEmitter {
    constructor() {
        super();
        // Keep track of listeners
        this.listenerCounts = new Map();
        this.setMaxListeners(50); // Set higher max listeners to avoid warnings
    }
    /**
     * Emit an authentication event with payload
     * @param eventName Event name
     * @param payload Event payload
     * @returns True if event had listeners
     */
    emitAuthEvent(eventName, payload) {
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
    onAuth(eventName, listener) {
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
    onceAuth(eventName, listener) {
        return this.once(eventName, listener);
    }
    /**
     * Remove specific listener
     * @param eventName Event name
     * @param listener Event listener function
     * @returns this (for chaining)
     */
    offAuth(eventName, listener) {
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
    removeAllAuthListeners(eventName) {
        if (eventName) {
            this.listenerCounts.delete(eventName);
        }
        else {
            this.listenerCounts.clear();
        }
        return this.removeAllListeners(eventName);
    }
    /**
     * Get number of listeners for an event
     * @param eventName Event name
     * @returns Number of listeners
     */
    listenerCount(eventName) {
        return super.listenerCount(eventName);
    }
    /**
     * Register default listeners for logging
     * @param logger Logger instance
     */
    registerDefaultLoggers(logger) {
        // Example of registering default loggers for all events
        Object.values(exports.AUTH_EVENTS).forEach(eventName => {
            this.onAuth(eventName, (payload) => {
                logger.debug(`Auth Event: ${eventName}`, {
                    event: eventName,
                    timestamp: payload.timestamp,
                    userId: payload.userId
                });
            });
        });
        // Add specific handlers for important events
        this.onAuth(exports.AUTH_EVENTS.LOGIN_FAILED, (payload) => {
            logger.warn(`Failed login attempt: ${payload.reason}`, {
                userId: payload.userId,
                email: payload.email,
                method: payload.method,
                ip: payload.ip,
                attempts: payload.attemptCount
            });
        });
        this.onAuth(exports.AUTH_EVENTS.RISK_ASSESSMENT, (payload) => {
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
exports.default = new AuthEventEmitter();
//# sourceMappingURL=eventEmitter.js.map