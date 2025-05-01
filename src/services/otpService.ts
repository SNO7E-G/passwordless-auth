import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import config from '../config';
import { TokenType, AuthToken } from '../interfaces';
import storageService from './storageService';
import events, { AUTH_EVENTS } from '../utils/eventEmitter';

// OTP generation strategies/providers
interface OtpProvider {
  generateOtp(length: number, options: OtpOptions): string;
  validateOtp(otp: string, secret: string, options: OtpOptions): boolean;
}

// OTP options
interface OtpOptions {
  algorithm?: string; // 'sha1', 'sha256', 'sha512'
  digits?: number;   // Number of digits in the OTP
  window?: number;   // Time window for TOTP in seconds
  period?: number;   // TOTP period in seconds (default 30)
  step?: number;     // Step count for HOTP
  addChecksum?: boolean; // Add checksum digit
  secret?: string;   // Secret for OTP generation
}

/**
 * Simple numeric OTP generator
 */
class NumericOtpProvider implements OtpProvider {
  generateOtp(length: number, options: OtpOptions): string {
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
  
  validateOtp(otp: string, secret: string, options: OtpOptions): boolean {
    // For numeric OTP, we just compare the stored OTP with the provided one
    return otp === secret;
  }
}

/**
 * HMAC-based OTP provider (for HOTP and TOTP)
 */
class HmacOtpProvider implements OtpProvider {
  generateOtp(length: number, options: OtpOptions): string {
    const secret = options.secret || crypto.randomBytes(20).toString('hex');
    const algorithm = options.algorithm || 'sha1';
    let counterValue = options.step || Math.floor(Date.now() / 1000 / (options.period || 30));
    
    // Create counter buffer
    const counterBuffer = Buffer.alloc(8);
    for (let i = 0; i < 8; i++) {
      counterBuffer[7 - i] = counterValue & 0xff;
      counterValue = counterValue >> 8;
    }
    
    // Generate HMAC
    const hmac = crypto.createHmac(algorithm, Buffer.from(secret, 'hex'));
    hmac.update(counterBuffer);
    const hmacResult = hmac.digest();
    
    // Generate OTP
    const offset = hmacResult[hmacResult.length - 1] & 0xf;
    const binary =
      ((hmacResult[offset] & 0x7f) << 24) |
      ((hmacResult[offset + 1] & 0xff) << 16) |
      ((hmacResult[offset + 2] & 0xff) << 8) |
      (hmacResult[offset + 3] & 0xff);
    
    const otp = binary % Math.pow(10, length);
    return otp.toString().padStart(length, '0');
  }
  
  validateOtp(otp: string, secret: string, options: OtpOptions): boolean {
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
      const hmac = crypto.createHmac(algorithm, Buffer.from(secret, 'hex'));
      hmac.update(counterBuffer);
      const hmacResult = hmac.digest();
      
      // Generate OTP
      const offset = hmacResult[hmacResult.length - 1] & 0xf;
      const binary =
        ((hmacResult[offset] & 0x7f) << 24) |
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
class AlphanumericOtpProvider implements OtpProvider {
  generateOtp(length: number, options: OtpOptions): string {
    // Default character set without easily confused characters
    const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
    let otp = "";
    
    // Generate random characters
    for (let i = 0; i < length; i++) {
      otp += chars[Math.floor(Math.random() * chars.length)];
    }
    
    return otp;
  }
  
  validateOtp(otp: string, secret: string, options: OtpOptions): boolean {
    // For alphanumeric OTP, we just compare the stored OTP with the provided one
    return otp.toUpperCase() === secret.toUpperCase();
  }
}

// Extended event payload for OTP events
interface OtpEventPayload {
  timestamp: Date;
  userId: string;
  type?: TokenType;
}

// Extended event payload for token verification
interface TokenVerifiedPayload {
  timestamp: Date;
  userId: string;
  tokenId: string;
  type: TokenType;
}

class OtpService {
  private providers: Map<string, OtpProvider> = new Map();
  private otpStore: Map<string, { otp: string, expires: Date }> = new Map();
  
  constructor() {
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
  async generateOtp(
    userId: string,
    type: TokenType,
    options: { 
      providerType?: string;
      length?: number;
      expiresIn?: number;
      algorithm?: string;
      addChecksum?: boolean;
    } = {}
  ): Promise<{ otp: string; expiresAt: Date }> {
    // Get provider
    const providerType = options.providerType || 'numeric';
    const provider = this.providers.get(providerType);
    
    if (!provider) {
      throw new Error(`OTP provider '${providerType}' not found`);
    }
    
    // Set options
    const length = options.length || config.security.otpLength;
    const expiresIn = options.expiresIn || config.security.otpExpiryMinutes;
    const expiresAt = new Date(Date.now() + expiresIn * 60 * 1000);
    
    // Generate OTP
    const otp = provider.generateOtp(length, {
      algorithm: options.algorithm || config.security.otpAlgorithm,
      addChecksum: options.addChecksum || false
    });
    
    // Store OTP in database
    await storageService.createToken({
      id: uuidv4(),
      userId,
      token: otp,
      type,
      expiresAt,
      used: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Emit event
    events.emitAuthEvent(AUTH_EVENTS.OTP_SENT, {
      timestamp: new Date(),
      userId,
      type
    } as OtpEventPayload);
    
    return { otp, expiresAt };
  }
  
  /**
   * Verify a one-time password
   * @param userId User ID
   * @param otp One-time password to verify
   * @param type Token type
   * @returns True if the OTP is valid
   */
  async verifyOtp(
    userId: string,
    otp: string,
    type: TokenType
  ): Promise<boolean> {
    // Get all unexpired tokens for the user
    const now = new Date();
    const tokens = await this.getUnexpiredTokens(userId, type);
    
    // Check each token
    for (const token of tokens) {
      if (token.token === otp && !token.used) {
        // Mark token as used
        await storageService.updateToken(token.id, { used: true });
        
        // Emit event
        events.emitAuthEvent(AUTH_EVENTS.TOKEN_VERIFIED, {
          timestamp: new Date(),
          userId,
          tokenId: token.id,
          type
        } as TokenVerifiedPayload);
        
        return true;
      }
    }
    
    // If no matching token found, emit failed event
    events.emitAuthEvent(AUTH_EVENTS.TOKEN_INVALID, {
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
  private async getUnexpiredTokens(userId: string, type: TokenType): Promise<AuthToken[]> {
    // In a real implementation, this would query the database
    // For now, we'll use the in-memory store for demo purposes
    
    // This is a placeholder - in a real implementation, the storage service
    // would provide a method to fetch unexpired tokens
    const tokens: AuthToken[] = []; // Placeholder for actual implementation
    
    return tokens;
  }
  
  /**
   * Register a custom OTP provider
   * @param name Provider name
   * @param provider OTP provider implementation
   */
  registerProvider(name: string, provider: OtpProvider): void {
    this.providers.set(name, provider);
  }
  
  /**
   * Get available provider names
   * @returns Array of provider names
   */
  getProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}

export default new OtpService(); 