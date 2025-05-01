import { TokenType } from '../interfaces';
interface OtpProvider {
    generateOtp(length: number, options: OtpOptions): string;
    validateOtp(otp: string, secret: string, options: OtpOptions): boolean;
}
interface OtpOptions {
    algorithm?: string;
    digits?: number;
    window?: number;
    period?: number;
    step?: number;
    addChecksum?: boolean;
    secret?: string;
}
declare class OtpService {
    private providers;
    private otpStore;
    constructor();
    /**
     * Generate a one-time password
     * @param userId User ID
     * @param type Token type (OTP_EMAIL, OTP_SMS, etc.)
     * @param options OTP generation options
     * @returns Generated OTP and its expiration time
     */
    generateOtp(userId: string, type: TokenType, options?: {
        providerType?: string;
        length?: number;
        expiresIn?: number;
        algorithm?: string;
        addChecksum?: boolean;
    }): Promise<{
        otp: string;
        expiresAt: Date;
    }>;
    /**
     * Verify a one-time password
     * @param userId User ID
     * @param otp One-time password to verify
     * @param type Token type
     * @returns True if the OTP is valid
     */
    verifyOtp(userId: string, otp: string, type: TokenType): Promise<boolean>;
    /**
     * Get unexpired tokens for user
     * @param userId User ID
     * @param type Token type
     * @returns Array of unexpired tokens
     */
    private getUnexpiredTokens;
    /**
     * Register a custom OTP provider
     * @param name Provider name
     * @param provider OTP provider implementation
     */
    registerProvider(name: string, provider: OtpProvider): void;
    /**
     * Get available provider names
     * @returns Array of provider names
     */
    getProviders(): string[];
}
declare const _default: OtpService;
export default _default;
