"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRandomBase64 = exports.generateTotpSecret = exports.generateTimeBasedToken = exports.generateHmacToken = void 0;
exports.generateRandomToken = generateRandomToken;
exports.generateNumericToken = generateNumericToken;
exports.generateAlphanumericToken = generateAlphanumericToken;
exports.generateUuid = generateUuid;
exports.generateWebAuthnChallenge = generateWebAuthnChallenge;
const crypto_1 = __importDefault(require("crypto"));
const uuid_1 = require("uuid");
/**
 * Generate a HMAC token
 * @param text Text to hash
 * @param secret Secret key
 * @param algorithm Hash algorithm (default: sha256)
 * @returns HMAC token
 */
const generateHmacToken = (text, secret, algorithm = 'sha256') => {
    return crypto_1.default.createHmac(algorithm, secret).update(text).digest('hex');
};
exports.generateHmacToken = generateHmacToken;
/**
 * Generate a time-based token with expiration
 * @param userId User ID
 * @param secret Secret key
 * @param expiresInMinutes Expiration time in minutes
 * @returns Token with expiration
 */
const generateTimeBasedToken = (userId, secret, expiresInMinutes = 15) => {
    const expiresAt = Date.now() + expiresInMinutes * 60 * 1000;
    const tokenData = `${userId}:${expiresAt}`;
    return `${(0, exports.generateHmacToken)(tokenData, secret)}:${expiresAt}`;
};
exports.generateTimeBasedToken = generateTimeBasedToken;
/**
 * Generate a TOTP secret key
 * @returns TOTP secret key
 */
const generateTotpSecret = () => {
    // Use hex encoding instead of base32
    const randomBytes = crypto_1.default.randomBytes(20).toString('hex');
    // If base32 encoding is needed, we can implement it properly or use a library
    // For now, we're returning a hex-encoded string as a workaround
    return randomBytes;
};
exports.generateTotpSecret = generateTotpSecret;
/**
 * Generate a random base64 string
 * @returns Random base64 string
 */
const generateRandomBase64 = () => {
    return crypto_1.default.randomBytes(32).toString('base64');
};
exports.generateRandomBase64 = generateRandomBase64;
/**
 * Generate a cryptographically secure random token
 * @param length Length of the token (default: 32)
 * @returns Random token string
 */
function generateRandomToken(length = 32) {
    return crypto_1.default.randomBytes(Math.ceil(length * 0.75))
        .toString('hex')
        .slice(0, length);
}
/**
 * Generate a cryptographically secure numeric token
 * @param length Length of the token (default: 6)
 * @returns Random numeric token
 */
function generateNumericToken(length = 6) {
    let token = '';
    const buffer = crypto_1.default.randomBytes(length);
    for (let i = 0; i < length; i++) {
        // Use modulo 10 to get a digit (0-9)
        token += buffer[i] % 10;
    }
    return token;
}
/**
 * Generate a cryptographically secure alphanumeric token
 * @param length Length of the token (default: 8)
 * @returns Random alphanumeric token
 */
function generateAlphanumericToken(length = 8) {
    // Character set without easily confused characters
    const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    let token = '';
    const buffer = crypto_1.default.randomBytes(length);
    for (let i = 0; i < length; i++) {
        // Use modulo to get a character from the charset
        token += charset[buffer[i] % charset.length];
    }
    return token;
}
/**
 * Generate a UUID v4
 * @returns UUID string
 */
function generateUuid() {
    return (0, uuid_1.v4)();
}
/**
 * Generate a WebAuthn challenge for authentication
 * @returns A base64 encoded random string
 */
function generateWebAuthnChallenge() {
    return (0, exports.generateRandomBase64)();
}
//# sourceMappingURL=tokenGenerator.js.map