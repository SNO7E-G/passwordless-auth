/**
 * Generate a HMAC token
 * @param text Text to hash
 * @param secret Secret key
 * @param algorithm Hash algorithm (default: sha256)
 * @returns HMAC token
 */
export declare const generateHmacToken: (text: string, secret: string, algorithm?: string) => string;
/**
 * Generate a time-based token with expiration
 * @param userId User ID
 * @param secret Secret key
 * @param expiresInMinutes Expiration time in minutes
 * @returns Token with expiration
 */
export declare const generateTimeBasedToken: (userId: string, secret: string, expiresInMinutes?: number) => string;
/**
 * Generate a TOTP secret key
 * @returns TOTP secret key
 */
export declare const generateTotpSecret: () => string;
/**
 * Generate a random base64 string
 * @returns Random base64 string
 */
export declare const generateRandomBase64: () => string;
/**
 * Generate a cryptographically secure random token
 * @param length Length of the token (default: 32)
 * @returns Random token string
 */
export declare function generateRandomToken(length?: number): string;
/**
 * Generate a cryptographically secure numeric token
 * @param length Length of the token (default: 6)
 * @returns Random numeric token
 */
export declare function generateNumericToken(length?: number): string;
/**
 * Generate a cryptographically secure alphanumeric token
 * @param length Length of the token (default: 8)
 * @returns Random alphanumeric token
 */
export declare function generateAlphanumericToken(length?: number): string;
/**
 * Generate a UUID v4
 * @returns UUID string
 */
export declare function generateUuid(): string;
/**
 * Generate a WebAuthn challenge for authentication
 * @returns A base64 encoded random string
 */
export declare function generateWebAuthnChallenge(): string;
