import { v4 as uuidv4 } from 'uuid';
import { generateWebAuthnChallenge } from '../utils/tokenGenerator';
import config from '../config';
import { 
  WebAuthnRegistrationOptions, 
  WebAuthnRegistrationResult,
  WebAuthnCredential
} from '../interfaces';

class WebAuthnService {
  // In-memory store for WebAuthn credentials - would use a database in production
  private credentials: Map<string, WebAuthnCredential> = new Map();
  private challenges: Map<string, { userId: string, challenge: string, rpId: string }> = new Map();
  
  /**
   * Generate registration options for WebAuthn
   * @param userId User ID
   * @param username User's email or username
   * @param displayName User's display name
   * @returns Registration options
   */
  generateRegistrationOptions(userId: string, username: string, displayName: string): WebAuthnRegistrationOptions {
    const challenge = generateWebAuthnChallenge();
    const rpId = new URL(config.baseUrl).hostname;
    
    // Store the challenge for later verification
    this.challenges.set(userId, {
      userId,
      challenge,
      rpId,
    });
    
    return {
      challenge,
      rp: {
        name: 'Passwordless Auth',
        id: rpId,
      },
      user: {
        id: userId,
        name: username,
        displayName: displayName || username,
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 }, // ES256
        { type: 'public-key', alg: -257 }, // RS256
      ],
      timeout: 60000,
      attestation: 'direct',
      excludeCredentials: this.getExistingCredentialsForUser(userId),
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        requireResidentKey: false,
        userVerification: 'preferred',
      },
    };
  }
  
  /**
   * Verify a WebAuthn registration response
   * @param userId User ID
   * @param credential WebAuthn credential from browser
   * @param deviceName Optional name for the device
   * @returns Success status
   */
  async verifyRegistration(
    userId: string, 
    credential: WebAuthnRegistrationResult,
    deviceName?: string
  ): Promise<boolean> {
    // Get stored challenge
    const storedData = this.challenges.get(userId);
    if (!storedData) {
      return false;
    }
    
    // Remove challenge after use
    this.challenges.delete(userId);
    
    try {
      // In a real implementation, we would perform proper verification of the attestation
      // This is a simplified example that just stores the credential
      
      // Parse client data
      const clientDataJSON = Buffer.from(credential.response.clientDataJSON, 'base64').toString();
      const clientData = JSON.parse(clientDataJSON);
      
      // Verify challenge
      if (clientData.challenge !== storedData.challenge) {
        return false;
      }
      
      // Verify origin
      const origin = clientData.origin;
      if (!config.corsOrigins.includes(origin)) {
        return false;
      }
      
      // Store credential (in a real implementation, we would extract the public key properly)
      const newCredential: WebAuthnCredential = {
        id: credential.id,
        userId,
        publicKey: credential.response.attestationObject, // Simplified - would extract actual public key
        counter: 0,
        deviceName: deviceName || 'Unknown device',
        createdAt: new Date(),
        lastUsedAt: new Date(),
      };
      
      this.credentials.set(newCredential.id, newCredential);
      
      return true;
    } catch (error) {
      console.error('Error verifying WebAuthn registration:', error);
      return false;
    }
  }
  
  /**
   * Generate authentication options for WebAuthn
   * @param userId User ID
   * @returns Authentication options
   */
  generateAuthenticationOptions(userId: string) {
    const challenge = generateWebAuthnChallenge();
    const rpId = new URL(config.baseUrl).hostname;
    
    // Store the challenge
    this.challenges.set(userId, {
      userId,
      challenge,
      rpId,
    });
    
    return {
      challenge,
      rpId,
      timeout: 60000,
      userVerification: 'preferred',
      allowCredentials: this.getExistingCredentialsForUser(userId),
    };
  }
  
  /**
   * Verify an authentication response
   * @param userId User ID
   * @param credential WebAuthn assertion from browser
   * @returns Success status
   */
  async verifyAuthentication(userId: string, credential: any): Promise<boolean> {
    // Get stored challenge
    const storedData = this.challenges.get(userId);
    if (!storedData) {
      return false;
    }
    
    // Remove challenge after use
    this.challenges.delete(userId);
    
    try {
      // Get the credential
      const storedCredential = this.credentials.get(credential.id);
      if (!storedCredential || storedCredential.userId !== userId) {
        return false;
      }
      
      // In a real implementation, we would perform proper verification of the assertion
      // This is a simplified example
      
      // Parse client data
      const clientDataJSON = Buffer.from(credential.response.clientDataJSON, 'base64').toString();
      const clientData = JSON.parse(clientDataJSON);
      
      // Verify challenge
      if (clientData.challenge !== storedData.challenge) {
        return false;
      }
      
      // Verify origin
      const origin = clientData.origin;
      if (!config.corsOrigins.includes(origin)) {
        return false;
      }
      
      // Update credential usage
      storedCredential.lastUsedAt = new Date();
      
      // In a real implementation, we would update the counter to prevent replay attacks
      
      return true;
    } catch (error) {
      console.error('Error verifying WebAuthn authentication:', error);
      return false;
    }
  }
  
  /**
   * Get list of credentials for a user
   * @param userId User ID
   * @returns Array of credential IDs
   */
  private getExistingCredentialsForUser(userId: string) {
    return Array.from(this.credentials.values())
      .filter(cred => cred.userId === userId)
      .map(cred => ({
        id: cred.id,
        type: 'public-key',
        transports: ['internal', 'usb', 'ble', 'nfc'],
      }));
  }
  
  /**
   * Get all credentials for a user
   * @param userId User ID
   * @returns Array of credentials
   */
  getCredentialsForUser(userId: string): WebAuthnCredential[] {
    return Array.from(this.credentials.values())
      .filter(cred => cred.userId === userId);
  }
  
  /**
   * Remove a credential
   * @param credentialId Credential ID
   * @param userId User ID (for verification)
   * @returns Success status
   */
  removeCredential(credentialId: string, userId: string): boolean {
    const credential = this.credentials.get(credentialId);
    
    if (!credential || credential.userId !== userId) {
      return false;
    }
    
    return this.credentials.delete(credentialId);
  }
}

export default new WebAuthnService(); 