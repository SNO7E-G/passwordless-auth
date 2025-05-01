import crypto from 'crypto';
import { generateTotpSecret } from '../utils/tokenGenerator';
import { TotpSetupResponse } from '../interfaces';

class TotpService {
  // In-memory store for TOTP secrets - would use a database in production
  private secrets: Map<string, { secret: string, createdAt: Date, verified: boolean }> = new Map();
  
  /**
   * Generate a new TOTP setup for a user
   * @param userId User ID
   * @param issuer Name of the service/app
   * @param accountName User's account name (usually email)
   * @returns TOTP setup data including QR code URL
   */
  generateTotpSetup(userId: string, issuer: string = 'PasswordlessAuth', accountName: string): TotpSetupResponse {
    const secret = generateTotpSecret();
    
    // Store the secret
    this.secrets.set(userId, {
      secret,
      createdAt: new Date(),
      verified: false,
    });
    
    // Generate otpauth URL for QR code
    const encodedIssuer = encodeURIComponent(issuer);
    const encodedAccount = encodeURIComponent(accountName);
    const otpauthUrl = `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
    
    return {
      secret,
      qrCodeUrl: otpauthUrl, // In a real app, you might generate an actual QR code image
    };
  }
  
  /**
   * Verify a TOTP code
   * @param userId User ID
   * @param code TOTP code from authenticator app
   * @returns Whether the code is valid
   */
  verifyTotp(userId: string, code: string): boolean {
    const userData = this.secrets.get(userId);
    
    if (!userData) {
      return false;
    }
    
    const { secret } = userData;
    const isValid = this.verifyTotpCode(secret, code);
    
    if (isValid) {
      // Mark as verified after first successful verification
      userData.verified = true;
    }
    
    return isValid;
  }
  
  /**
   * Disable TOTP for a user
   * @param userId User ID
   * @returns Success status
   */
  disableTotp(userId: string): boolean {
    return this.secrets.delete(userId);
  }
  
  /**
   * Check if a user has TOTP enabled
   * @param userId User ID
   * @returns Whether TOTP is enabled and verified
   */
  isTotpEnabled(userId: string): boolean {
    const userData = this.secrets.get(userId);
    return !!(userData && userData.verified);
  }
  
  /**
   * Verify a TOTP code against a secret
   * @param secret TOTP secret
   * @param code Code to verify
   * @returns Whether the code is valid
   */
  private verifyTotpCode(secret: string, code: string): boolean {
    // Allow codes from the previous, current, and next time window
    for (let window = -1; window <= 1; window++) {
      const calculatedCode = this.generateTotpCode(secret, window);
      if (calculatedCode === code) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Generate a TOTP code for a specific time window
   * @param secret TOTP secret
   * @param window Time window offset (0 = current)
   * @returns Generated TOTP code
   */
  private generateTotpCode(secret: string, window: number = 0): string {
    // TOTP parameters
    const timeStep = 30; // seconds
    const digits = 6;
    const algorithm = 'sha1';
    
    // Calculate counter value (number of time steps since Unix epoch)
    const now = Math.floor(Date.now() / 1000);
    let counterValue = Math.floor(now / timeStep) + window;
    
    // Convert counter to buffer
    const counterBuffer = Buffer.alloc(8);
    for (let i = 0; i < 8; i++) {
      counterBuffer[7 - i] = counterValue & 0xff;
      counterValue = counterValue >> 8;
    }
    
    // Generate HMAC
    const key = this.base32ToBuffer(secret);
    const hmac = crypto.createHmac(algorithm, key);
    hmac.update(counterBuffer);
    const hmacResult = hmac.digest();
    
    // Dynamic truncation
    const offset = hmacResult[hmacResult.length - 1] & 0xf;
    const binary = ((hmacResult[offset] & 0x7f) << 24) |
                  ((hmacResult[offset + 1] & 0xff) << 16) |
                  ((hmacResult[offset + 2] & 0xff) << 8) |
                  (hmacResult[offset + 3] & 0xff);
    
    // Generate code with specified number of digits
    const code = binary % Math.pow(10, digits);
    return code.toString().padStart(digits, '0');
  }
  
  /**
   * Convert base32 string to buffer
   * @param base32 Base32 encoded string
   * @returns Buffer
   */
  private base32ToBuffer(base32: string): Buffer {
    const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = '';
    
    // Convert each character to 5 bits
    for (let i = 0; i < base32.length; i++) {
      const val = base32Chars.indexOf(base32.charAt(i).toUpperCase());
      if (val === -1) continue; // Skip non-base32 chars
      bits += val.toString(2).padStart(5, '0');
    }
    
    // Convert bits to bytes
    const bytes = new Uint8Array(Math.floor(bits.length / 8));
    for (let i = 0; i < bytes.length; i++) {
      const byteStr = bits.substr(i * 8, 8);
      bytes[i] = parseInt(byteStr, 2);
    }
    
    return Buffer.from(bytes);
  }
}

export default new TotpService(); 