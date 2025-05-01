import { TotpSetupResponse } from '../interfaces';
declare class TotpService {
    private secrets;
    /**
     * Generate a new TOTP setup for a user
     * @param userId User ID
     * @param issuer Name of the service/app
     * @param accountName User's account name (usually email)
     * @returns TOTP setup data including QR code URL
     */
    generateTotpSetup(userId: string, issuer: string | undefined, accountName: string): TotpSetupResponse;
    /**
     * Verify a TOTP code
     * @param userId User ID
     * @param code TOTP code from authenticator app
     * @returns Whether the code is valid
     */
    verifyTotp(userId: string, code: string): boolean;
    /**
     * Disable TOTP for a user
     * @param userId User ID
     * @returns Success status
     */
    disableTotp(userId: string): boolean;
    /**
     * Check if a user has TOTP enabled
     * @param userId User ID
     * @returns Whether TOTP is enabled and verified
     */
    isTotpEnabled(userId: string): boolean;
    /**
     * Verify a TOTP code against a secret
     * @param secret TOTP secret
     * @param code Code to verify
     * @returns Whether the code is valid
     */
    private verifyTotpCode;
    /**
     * Generate a TOTP code for a specific time window
     * @param secret TOTP secret
     * @param window Time window offset (0 = current)
     * @returns Generated TOTP code
     */
    private generateTotpCode;
    /**
     * Convert base32 string to buffer
     * @param base32 Base32 encoded string
     * @returns Buffer
     */
    private base32ToBuffer;
}
declare const _default: TotpService;
export default _default;
