import { MagicLinkOptions, OtpOptions, AuthResponse, VerificationResult } from '../interfaces';
/**
 * Authentication service for managing passwordless authentication
 */
declare class AuthService {
    /**
     * Send a magic link to a user's email
     * @param email User's email address
     * @param options Magic link options
     * @returns Result of the operation
     */
    sendMagicLink(email: string, options?: MagicLinkOptions): Promise<AuthResponse>;
    /**
     * Send an OTP to a user's email
     * @param email User's email address
     * @param options OTP options
     * @returns Result of the operation
     */
    sendEmailOTP(email: string, options?: OtpOptions): Promise<AuthResponse>;
    /**
     * Send an OTP to a user's phone via SMS
     * @param phone User's phone number
     * @param options OTP options
     * @returns Result of the operation
     */
    sendSmsOTP(phone: string, options?: OtpOptions): Promise<AuthResponse>;
    /**
     * Verify a magic link token
     * @param token Magic link token
     * @returns Result of the verification
     */
    verifyMagicLink(token: string): Promise<VerificationResult>;
    /**
     * Verify an OTP (email or SMS)
     * @param email User's email address (optional)
     * @param phone User's phone number (optional)
     * @param otp One-time password
     * @returns Result of the verification
     */
    verifyOTP(email?: string, phone?: string, otp?: string): Promise<VerificationResult>;
    /**
     * Validate a JWT token
     * @param token JWT token
     * @returns User if token is valid, null otherwise
     */
    validateToken(token: string): any | null;
    /**
     * Logout (invalidate token)
     * @param token JWT token
     * @returns Success status
     */
    logout(token: string): Promise<boolean>;
    /**
     * Create a JWT token
     * @param payload Token payload
     * @param expiresIn Token expiration time
     * @returns JWT token
     */
    private createJwtToken;
}
declare const _default: AuthService;
export default _default;
