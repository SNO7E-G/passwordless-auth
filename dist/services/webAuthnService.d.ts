import { WebAuthnRegistrationOptions, WebAuthnRegistrationResult, WebAuthnCredential } from '../interfaces';
declare class WebAuthnService {
    private credentials;
    private challenges;
    /**
     * Generate registration options for WebAuthn
     * @param userId User ID
     * @param username User's email or username
     * @param displayName User's display name
     * @returns Registration options
     */
    generateRegistrationOptions(userId: string, username: string, displayName: string): WebAuthnRegistrationOptions;
    /**
     * Verify a WebAuthn registration response
     * @param userId User ID
     * @param credential WebAuthn credential from browser
     * @param deviceName Optional name for the device
     * @returns Success status
     */
    verifyRegistration(userId: string, credential: WebAuthnRegistrationResult, deviceName?: string): Promise<boolean>;
    /**
     * Generate authentication options for WebAuthn
     * @param userId User ID
     * @returns Authentication options
     */
    generateAuthenticationOptions(userId: string): {
        challenge: string;
        rpId: string;
        timeout: number;
        userVerification: string;
        allowCredentials: {
            id: string;
            type: string;
            transports: string[];
        }[];
    };
    /**
     * Verify an authentication response
     * @param userId User ID
     * @param credential WebAuthn assertion from browser
     * @returns Success status
     */
    verifyAuthentication(userId: string, credential: any): Promise<boolean>;
    /**
     * Get list of credentials for a user
     * @param userId User ID
     * @returns Array of credential IDs
     */
    private getExistingCredentialsForUser;
    /**
     * Get all credentials for a user
     * @param userId User ID
     * @returns Array of credentials
     */
    getCredentialsForUser(userId: string): WebAuthnCredential[];
    /**
     * Remove a credential
     * @param credentialId Credential ID
     * @param userId User ID (for verification)
     * @returns Success status
     */
    removeCredential(credentialId: string, userId: string): boolean;
}
declare const _default: WebAuthnService;
export default _default;
