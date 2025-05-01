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
const crypto_1 = __importDefault(require("crypto"));
const uuid_1 = require("uuid");
const config_1 = __importDefault(require("../config"));
const storageService_1 = __importDefault(require("./storageService"));
const eventEmitter_1 = __importStar(require("../utils/eventEmitter"));
/**
 * Simple numeric OTP generator
 */
class NumericOtpProvider {
    generateOtp(length, options) {
        const digits = "0123456789";
        let otp = "";
        // Generate random digits
        for (let i = 0; i < length; i++) {
            otp += digits[Math.floor(Math.random() * 10)];
        }
        // Add checksum if requested
        if (options.addChecksum) {
            let sum = 0;
            for (let i = 0; i < otp.length; i++) {
                sum += parseInt(otp[i], 10);
            }
            otp += (sum % 10).toString();
        }
        return otp;
    }
    validateOtp(otp, secret, options) {
        // For numeric OTP, we just compare the stored OTP with the provided one
        return otp === secret;
    }
}
/**
 * HMAC-based OTP provider (for HOTP and TOTP)
 */
class HmacOtpProvider {
    generateOtp(length, options) {
        const secret = options.secret || crypto_1.default.randomBytes(20).toString('hex');
        const algorithm = options.algorithm || 'sha1';
        let counterValue = options.step || Math.floor(Date.now() / 1000 / (options.period || 30));
        // Create counter buffer
        const counterBuffer = Buffer.alloc(8);
        for (let i = 0; i < 8; i++) {
            counterBuffer[7 - i] = counterValue & 0xff;
            counterValue = counterValue >> 8;
        }
        // Generate HMAC
        const hmac = crypto_1.default.createHmac(algorithm, Buffer.from(secret, 'hex'));
        hmac.update(counterBuffer);
        const hmacResult = hmac.digest();
        // Generate OTP
        const offset = hmacResult[hmacResult.length - 1] & 0xf;
        const binary = ((hmacResult[offset] & 0x7f) << 24) |
            ((hmacResult[offset + 1] & 0xff) << 16) |
            ((hmacResult[offset + 2] & 0xff) << 8) |
            (hmacResult[offset + 3] & 0xff);
        const otp = binary % Math.pow(10, length);
        return otp.toString().padStart(length, '0');
    }
    validateOtp(otp, secret, options) {
        const window = options.window || 1; // Default window of 1 step
        const period = options.period || 30; // Default 30-second period
        const algorithm = options.algorithm || 'sha1';
        const digits = options.digits || 6;
        // For TOTP, check current and adjacent time windows
        const counter = Math.floor(Date.now() / 1000 / period);
        // Check OTP in the window
        for (let i = -window; i <= window; i++) {
            let testCounterValue = counter + i;
            const counterBuffer = Buffer.alloc(8);
            for (let j = 0; j < 8; j++) {
                counterBuffer[7 - j] = testCounterValue & 0xff;
                testCounterValue = testCounterValue >> 8;
            }
            // Generate HMAC
            const hmac = crypto_1.default.createHmac(algorithm, Buffer.from(secret, 'hex'));
            hmac.update(counterBuffer);
            const hmacResult = hmac.digest();
            // Generate OTP
            const offset = hmacResult[hmacResult.length - 1] & 0xf;
            const binary = ((hmacResult[offset] & 0x7f) << 24) |
                ((hmacResult[offset + 1] & 0xff) << 16) |
                ((hmacResult[offset + 2] & 0xff) << 8) |
                (hmacResult[offset + 3] & 0xff);
            const testOtp = (binary % Math.pow(10, digits)).toString().padStart(digits, '0');
            if (testOtp === otp) {
                return true;
            }
        }
        return false;
    }
}
/**
 * Alphanumeric OTP provider with custom character set
 */
class AlphanumericOtpProvider {
    generateOtp(length, options) {
        // Default character set without easily confused characters
        const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
        let otp = "";
        // Generate random characters
        for (let i = 0; i < length; i++) {
            otp += chars[Math.floor(Math.random() * chars.length)];
        }
        return otp;
    }
    validateOtp(otp, secret, options) {
        // For alphanumeric OTP, we just compare the stored OTP with the provided one
        return otp.toUpperCase() === secret.toUpperCase();
    }
}
class OtpService {
    constructor() {
        this.providers = new Map();
        this.otpStore = new Map();
        // Register providers
        this.providers.set('numeric', new NumericOtpProvider());
        this.providers.set('hmac', new HmacOtpProvider());
        this.providers.set('alphanumeric', new AlphanumericOtpProvider());
    }
    /**
     * Generate a one-time password
     * @param userId User ID
     * @param type Token type (OTP_EMAIL, OTP_SMS, etc.)
     * @param options OTP generation options
     * @returns Generated OTP and its expiration time
     */
    async generateOtp(userId, type, options = {}) {
        // Get provider
        const providerType = options.providerType || 'numeric';
        const provider = this.providers.get(providerType);
        if (!provider) {
            throw new Error(`OTP provider '${providerType}' not found`);
        }
        // Set options
        const length = options.length || config_1.default.security.otpLength;
        const expiresIn = options.expiresIn || config_1.default.security.otpExpiryMinutes;
        const expiresAt = new Date(Date.now() + expiresIn * 60 * 1000);
        // Generate OTP
        const otp = provider.generateOtp(length, {
            algorithm: options.algorithm || config_1.default.security.otpAlgorithm,
            addChecksum: options.addChecksum || false
        });
        // Store OTP in database
        await storageService_1.default.createToken({
            id: (0, uuid_1.v4)(),
            userId,
            token: otp,
            type,
            expiresAt,
            used: false,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        // Emit event
        eventEmitter_1.default.emitAuthEvent(eventEmitter_1.AUTH_EVENTS.OTP_SENT, {
            timestamp: new Date(),
            userId,
            type
        });
        return { otp, expiresAt };
    }
    /**
     * Verify a one-time password
     * @param userId User ID
     * @param otp One-time password to verify
     * @param type Token type
     * @returns True if the OTP is valid
     */
    async verifyOtp(userId, otp, type) {
        // Get all unexpired tokens for the user
        const now = new Date();
        const tokens = await this.getUnexpiredTokens(userId, type);
        // Check each token
        for (const token of tokens) {
            if (token.token === otp && !token.used) {
                // Mark token as used
                await storageService_1.default.updateToken(token.id, { used: true });
                // Emit event
                eventEmitter_1.default.emitAuthEvent(eventEmitter_1.AUTH_EVENTS.TOKEN_VERIFIED, {
                    timestamp: new Date(),
                    userId,
                    tokenId: token.id,
                    type
                });
                return true;
            }
        }
        // If no matching token found, emit failed event
        eventEmitter_1.default.emitAuthEvent(eventEmitter_1.AUTH_EVENTS.TOKEN_INVALID, {
            timestamp: new Date(),
            userId
        });
        return false;
    }
    /**
     * Get unexpired tokens for user
     * @param userId User ID
     * @param type Token type
     * @returns Array of unexpired tokens
     */
    async getUnexpiredTokens(userId, type) {
        // In a real implementation, this would query the database
        // For now, we'll use the in-memory store for demo purposes
        // This is a placeholder - in a real implementation, the storage service
        // would provide a method to fetch unexpired tokens
        const tokens = []; // Placeholder for actual implementation
        return tokens;
    }
    /**
     * Register a custom OTP provider
     * @param name Provider name
     * @param provider OTP provider implementation
     */
    registerProvider(name, provider) {
        this.providers.set(name, provider);
    }
    /**
     * Get available provider names
     * @returns Array of provider names
     */
    getProviders() {
        return Array.from(this.providers.keys());
    }
}
exports.default = new OtpService();
//# sourceMappingURL=otpService.js.map