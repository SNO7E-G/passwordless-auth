import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import config from '../config';

/**
 * Generate a HMAC token
 * @param text Text to hash
 * @param secret Secret key
 * @param algorithm Hash algorithm (default: sha256)
 * @returns HMAC token
 */
export const generateHmacToken = (
  text: string,
  secret: string,
  algorithm: string = 'sha256'
): string => {
  return crypto.createHmac(algorithm, secret).update(text).digest('hex');
};

/**
 * Generate a time-based token with expiration
 * @param userId User ID
 * @param secret Secret key
 * @param expiresInMinutes Expiration time in minutes
 * @returns Token with expiration
 */
export const generateTimeBasedToken = (
  userId: string,
  secret: string,
  expiresInMinutes: number = 15
): string => {
  const expiresAt = Date.now() + expiresInMinutes * 60 * 1000;
  const tokenData = `${userId}:${expiresAt}`;
  return `${generateHmacToken(tokenData, secret)}:${expiresAt}`;
};

/**
 * Generate a TOTP secret key
 * @returns TOTP secret key
 */
export const generateTotpSecret = (): string => {
  // Use hex encoding instead of base32
  const randomBytes = crypto.randomBytes(20).toString('hex');
  
  // If base32 encoding is needed, we can implement it properly or use a library
  // For now, we're returning a hex-encoded string as a workaround
  return randomBytes;
};

/**
 * Generate a random base64 string
 * @returns Random base64 string
 */
export const generateRandomBase64 = (): string => {
  return crypto.randomBytes(32).toString('base64');
};

/**
 * Generate a cryptographically secure random token
 * @param length Length of the token (default: 32)
 * @returns Random token string
 */
export function generateRandomToken(length: number = 32): string {
  return crypto.randomBytes(Math.ceil(length * 0.75))
    .toString('hex')
    .slice(0, length);
}

/**
 * Generate a cryptographically secure numeric token
 * @param length Length of the token (default: 6)
 * @returns Random numeric token
 */
export function generateNumericToken(length: number = 6): string {
  let token = '';
  const buffer = crypto.randomBytes(length);
  
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
export function generateAlphanumericToken(length: number = 8): string {
  // Character set without easily confused characters
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let token = '';
  const buffer = crypto.randomBytes(length);
  
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
export function generateUuid(): string {
  return uuidv4();
}

/**
 * Generate a WebAuthn challenge for authentication
 * @returns A base64 encoded random string
 */
export function generateWebAuthnChallenge(): string {
  return generateRandomBase64();
} 