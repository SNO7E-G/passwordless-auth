"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("../config"));
const tokenGenerator = __importStar(require("../utils/tokenGenerator"));
const emailService_1 = __importDefault(require("./emailService"));
const smsService_1 = __importDefault(require("./smsService"));
const storageService_1 = __importDefault(require("./storageService"));
const i18n_1 = __importDefault(require("../utils/i18n"));
const eventEmitter_1 = __importStar(require("../utils/eventEmitter"));
const interfaces_1 = require("../interfaces");
// Update token generator imports to match the new function names
const { generateRandomToken, generateNumericToken, generateUuid, generateHmacToken } = tokenGenerator;
/**
 * Authentication service for managing passwordless authentication
 */
class AuthService {
    /**
     * Send a magic link to a user's email
     * @param email User's email address
     * @param options Magic link options
     * @returns Result of the operation
     */
    async sendMagicLink(email, options = {}) {
        try {
            // Find or create user
            let user = await storageService_1.default.findUserByEmail(email);
            if (!user) {
                user = await storageService_1.default.createUser({
                    email,
                    verified: false,
                });
            }
            // Generate token
            const token = generateUuid();
            const expiresIn = options.expiresIn || config_1.default.security.magicLinkExpiryMinutes;
            const expiresAt = new Date(Date.now() + expiresIn * 60 * 1000);
            // Store token
            await storageService_1.default.createToken({
                userId: user.id,
                token: token,
                type: interfaces_1.TokenType.MAGIC_LINK,
                expiresAt,
                used: false,
            });
            // Generate magic link
            const baseUrl = options.redirectUrl || config_1.default.baseUrl;
            const magicLink = `${baseUrl}/verify?token=${token}`;
            // Get email template
            const templateName = 'magicLink';
            const template = i18n_1.default.getTemplate(templateName);
            // Render template with variables
            const renderedTemplate = i18n_1.default.renderTemplate(template, {
                link: magicLink,
                expiryMinutes: expiresIn.toString(),
                ...options.templateVars
            });
            // Send email - use rendered template as both text and HTML
            const subject = i18n_1.default.t('auth.magicLink.subject');
            // Using public method sendMail instead of private sendEmail
            const success = await emailService_1.default.sendMail(email, subject, renderedTemplate, renderedTemplate);
            // Emit event
            eventEmitter_1.default.emitAuthEvent(eventEmitter_1.AUTH_EVENTS.MAGIC_LINK_SENT, {
                timestamp: new Date(),
                userId: user.id,
                ip: undefined,
                userAgent: undefined
            });
            return {
                success,
                message: success ? 'Magic link sent successfully' : 'Failed to send magic link',
            };
        }
        catch (error) {
            console.error('Error sending magic link:', error);
            return {
                success: false,
                message: `Failed to send magic link: ${(error === null || error === void 0 ? void 0 : error.message) || 'Unknown error'}`,
            };
        }
    }
    /**
     * Send an OTP to a user's email
     * @param email User's email address
     * @param options OTP options
     * @returns Result of the operation
     */
    async sendEmailOTP(email, options = {}) {
        try {
            // Find or create user
            let user = await storageService_1.default.findUserByEmail(email);
            if (!user) {
                user = await storageService_1.default.createUser({
                    email,
                    verified: false,
                });
            }
            // Generate OTP
            const length = options.length || config_1.default.security.otpLength;
            const otp = generateNumericToken(length);
            const expiresIn = options.expiresIn || config_1.default.security.otpExpiryMinutes;
            const expiresAt = new Date(Date.now() + expiresIn * 60 * 1000);
            // Store token
            await storageService_1.default.createToken({
                userId: user.id,
                token: otp,
                type: interfaces_1.TokenType.OTP_EMAIL,
                expiresAt,
                used: false,
            });
            // Get email template
            const templateName = 'emailOtp';
            const template = i18n_1.default.getTemplate(templateName);
            // Render template with variables
            const renderedTemplate = i18n_1.default.renderTemplate(template, {
                otp,
                expiryMinutes: expiresIn.toString(),
                ...options.templateVars
            });
            // Send email - use rendered template as both text and HTML
            const subject = i18n_1.default.t('auth.otp.subject');
            // Using public method sendMail instead of private sendEmail
            const success = await emailService_1.default.sendMail(email, subject, renderedTemplate, renderedTemplate);
            // Emit event
            eventEmitter_1.default.emitAuthEvent(eventEmitter_1.AUTH_EVENTS.OTP_SENT, {
                timestamp: new Date(),
                userId: user.id,
                ip: undefined,
                userAgent: undefined
            });
            return {
                success,
                message: success ? 'OTP sent successfully' : 'Failed to send OTP',
            };
        }
        catch (error) {
            console.error('Error sending email OTP:', error);
            return {
                success: false,
                message: `Failed to send OTP: ${(error === null || error === void 0 ? void 0 : error.message) || 'Unknown error'}`,
            };
        }
    }
    /**
     * Send an OTP to a user's phone via SMS
     * @param phone User's phone number
     * @param options OTP options
     * @returns Result of the operation
     */
    async sendSmsOTP(phone, options = {}) {
        try {
            // Find or create user
            let user = await storageService_1.default.findUserByPhone(phone);
            if (!user) {
                user = await storageService_1.default.createUser({
                    phone,
                    verified: false,
                });
            }
            // Generate OTP
            const length = options.length || config_1.default.security.otpLength;
            const otp = generateNumericToken(length);
            const expiresIn = options.expiresIn || config_1.default.security.otpExpiryMinutes;
            const expiresAt = new Date(Date.now() + expiresIn * 60 * 1000);
            // Store token
            await storageService_1.default.createToken({
                userId: user.id,
                token: otp,
                type: interfaces_1.TokenType.OTP_SMS,
                expiresAt,
                used: false,
            });
            // Prepare message
            const message = i18n_1.default.t('auth.otp.body') + ' ' + otp;
            // Send SMS using the correct method name
            const success = await smsService_1.default.sendMessage(phone, message);
            // Emit event
            eventEmitter_1.default.emitAuthEvent(eventEmitter_1.AUTH_EVENTS.OTP_SENT, {
                timestamp: new Date(),
                userId: user.id,
                ip: undefined,
                userAgent: undefined
            });
            return {
                success,
                message: success ? 'OTP sent successfully' : 'Failed to send OTP',
            };
        }
        catch (error) {
            console.error('Error sending SMS OTP:', error);
            return {
                success: false,
                message: `Failed to send OTP: ${(error === null || error === void 0 ? void 0 : error.message) || 'Unknown error'}`,
            };
        }
    }
    /**
     * Verify a magic link token
     * @param token Magic link token
     * @returns Result of the verification
     */
    async verifyMagicLink(token) {
        try {
            // Find token
            const tokenRecord = await storageService_1.default.findTokenByToken(token);
            if (!tokenRecord) {
                return {
                    success: false,
                    message: 'Invalid token',
                };
            }
            // Check if token is expired
            const now = new Date();
            if (tokenRecord.expiresAt < now) {
                return {
                    success: false,
                    message: 'Token has expired',
                };
            }
            // Check if token has been used
            if (tokenRecord.used) {
                return {
                    success: false,
                    message: 'Token has already been used',
                };
            }
            // Find user
            const user = await storageService_1.default.findUserById(tokenRecord.userId);
            if (!user) {
                return {
                    success: false,
                    message: 'User not found',
                };
            }
            // Mark token as used
            await storageService_1.default.updateToken(tokenRecord.id, { used: true });
            // Mark user as verified if not already
            if (!user.verified) {
                await storageService_1.default.updateUser(user.id, { verified: true });
            }
            // Create session token
            const sessionToken = this.createJwtToken({
                id: user.id,
                email: user.email
            });
            // Emit event
            eventEmitter_1.default.emitAuthEvent(eventEmitter_1.AUTH_EVENTS.LOGIN_SUCCESS, {
                timestamp: new Date(),
                userId: user.id,
                ip: undefined,
                userAgent: undefined
            });
            return {
                success: true,
                message: 'Token verified successfully',
                user,
                token: sessionToken,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
            };
        }
        catch (error) {
            console.error('Error verifying magic link:', error);
            return {
                success: false,
                message: `Failed to verify token: ${(error === null || error === void 0 ? void 0 : error.message) || 'Unknown error'}`,
            };
        }
    }
    /**
     * Verify an OTP (email or SMS)
     * @param email User's email address (optional)
     * @param phone User's phone number (optional)
     * @param otp One-time password
     * @returns Result of the verification
     */
    async verifyOTP(email, phone, otp) {
        try {
            if (!otp) {
                return {
                    success: false,
                    message: 'OTP is required',
                };
            }
            if (!email && !phone) {
                return {
                    success: false,
                    message: 'Email or phone is required',
                };
            }
            // Find user by email or phone
            const user = email
                ? await storageService_1.default.findUserByEmail(email)
                : await storageService_1.default.findUserByPhone(phone);
            if (!user) {
                return {
                    success: false,
                    message: 'User not found',
                };
            }
            // Find token
            const tokenRecord = await storageService_1.default.findTokenByToken(otp);
            if (!tokenRecord) {
                return {
                    success: false,
                    message: 'Invalid OTP',
                };
            }
            // Check if token belongs to the user
            if (tokenRecord.userId !== user.id) {
                return {
                    success: false,
                    message: 'Invalid OTP',
                };
            }
            // Check token type
            const tokenType = email ? interfaces_1.TokenType.OTP_EMAIL : interfaces_1.TokenType.OTP_SMS;
            if (tokenRecord.type !== tokenType) {
                return {
                    success: false,
                    message: 'Invalid OTP type',
                };
            }
            // Check if token is expired
            const now = new Date();
            if (tokenRecord.expiresAt < now) {
                return {
                    success: false,
                    message: 'OTP has expired',
                };
            }
            // Check if token has been used
            if (tokenRecord.used) {
                return {
                    success: false,
                    message: 'OTP has already been used',
                };
            }
            // Mark token as used
            await storageService_1.default.updateToken(tokenRecord.id, { used: true });
            // Mark user as verified if not already
            if (!user.verified) {
                await storageService_1.default.updateUser(user.id, { verified: true });
            }
            // Create session token
            const sessionToken = this.createJwtToken({
                id: user.id,
                email: user.email,
                phone: user.phone
            });
            // Emit event
            eventEmitter_1.default.emitAuthEvent(eventEmitter_1.AUTH_EVENTS.LOGIN_SUCCESS, {
                timestamp: new Date(),
                userId: user.id,
                ip: undefined,
                userAgent: undefined
            });
            return {
                success: true,
                message: 'OTP verified successfully',
                user,
                token: sessionToken,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
            };
        }
        catch (error) {
            console.error('Error verifying OTP:', error);
            return {
                success: false,
                message: `Failed to verify OTP: ${(error === null || error === void 0 ? void 0 : error.message) || 'Unknown error'}`,
            };
        }
    }
    /**
     * Validate a JWT token
     * @param token JWT token
     * @returns User if token is valid, null otherwise
     */
    validateToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, config_1.default.jwt.secret);
            return decoded;
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Logout (invalidate token)
     * @param token JWT token
     * @returns Success status
     */
    async logout(token) {
        try {
            // In a real implementation, we would add the token to a blacklist
            // or remove the session from the database
            // For now, we'll just emit the logout event
            const user = this.validateToken(token);
            if (user) {
                eventEmitter_1.default.emitAuthEvent(eventEmitter_1.AUTH_EVENTS.LOGOUT, {
                    timestamp: new Date(),
                    userId: user.id,
                    ip: undefined,
                    userAgent: undefined
                });
            }
            return true;
        }
        catch (error) {
            console.error('Error logging out:', error);
            return false;
        }
    }
    /**
     * Create a JWT token
     * @param payload Token payload
     * @param expiresIn Token expiration time
     * @returns JWT token
     */
    createJwtToken(payload, expiresIn = '1d') {
        const jwtSecret = config_1.default.jwt.secret;
        // Create JWT token with type assertion to avoid TypeScript error
        const token = jsonwebtoken_1.default.sign(payload, jwtSecret, { expiresIn });
        return token;
    }
}
exports.default = new AuthService();
//# sourceMappingURL=authService.js.map