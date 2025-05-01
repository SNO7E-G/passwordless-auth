import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import config from '../config';
import * as tokenGenerator from '../utils/tokenGenerator';
import emailService from './emailService';
import smsService from './smsService';
import storageService from './storageService';
import i18n from '../utils/i18n';
import events, { AUTH_EVENTS } from '../utils/eventEmitter';
import { 
  User, 
  AuthToken, 
  TokenType, 
  MagicLinkOptions, 
  OtpOptions, 
  AuthResponse, 
  VerificationResult 
} from '../interfaces';
import { SignOptions } from 'jsonwebtoken';

// Update token generator imports to match the new function names
const { 
  generateRandomToken, 
  generateNumericToken, 
  generateUuid,
  generateHmacToken 
} = tokenGenerator;

/**
 * Authentication service for managing passwordless authentication
 */
class AuthService {
  /**
   * Send a magic link to a user's email
   * @param email User's email address
   * @param options Magic link options
   * @returns Result of the operation
   */
  async sendMagicLink(
    email: string,
    options: MagicLinkOptions = {}
  ): Promise<AuthResponse> {
    try {
      // Find or create user
      let user = await storageService.findUserByEmail(email);
      
      if (!user) {
        user = await storageService.createUser({
          email,
          verified: false,
        });
      }
      
      // Generate token
      const token = generateUuid();
      const expiresIn = options.expiresIn || config.security.magicLinkExpiryMinutes;
      const expiresAt = new Date(Date.now() + expiresIn * 60 * 1000);
      
      // Store token
      await storageService.createToken({
        userId: user.id,
        token: token,
        type: TokenType.MAGIC_LINK,
        expiresAt,
        used: false,
      });
      
      // Generate magic link
      const baseUrl = options.redirectUrl || config.baseUrl;
      const magicLink = `${baseUrl}/verify?token=${token}`;
      
      // Get email template
      const templateName = 'magicLink';
      const template = i18n.getTemplate(templateName);
      
      // Render template with variables
      const renderedTemplate = i18n.renderTemplate(template, {
        link: magicLink,
        expiryMinutes: expiresIn.toString(),
        ...options.templateVars
      });
      
      // Send email - use rendered template as both text and HTML
      const subject = i18n.t('auth.magicLink.subject');
      // Using public method sendMail instead of private sendEmail
      const success = await emailService.sendMail(email, subject, renderedTemplate, renderedTemplate);
      
      // Emit event
      events.emitAuthEvent(AUTH_EVENTS.MAGIC_LINK_SENT, {
        timestamp: new Date(),
        userId: user.id,
        ip: undefined,
        userAgent: undefined
      });
      
      return {
        success,
        message: success ? 'Magic link sent successfully' : 'Failed to send magic link',
      };
    } catch (error: any) {
      console.error('Error sending magic link:', error);
      return {
        success: false,
        message: `Failed to send magic link: ${error?.message || 'Unknown error'}`,
      };
    }
  }
  
  /**
   * Send an OTP to a user's email
   * @param email User's email address
   * @param options OTP options
   * @returns Result of the operation
   */
  async sendEmailOTP(
    email: string,
    options: OtpOptions = {}
  ): Promise<AuthResponse> {
    try {
      // Find or create user
      let user = await storageService.findUserByEmail(email);
      
      if (!user) {
        user = await storageService.createUser({
          email,
          verified: false,
        });
      }
      
      // Generate OTP
      const length = options.length || config.security.otpLength;
      const otp = generateNumericToken(length);
      const expiresIn = options.expiresIn || config.security.otpExpiryMinutes;
      const expiresAt = new Date(Date.now() + expiresIn * 60 * 1000);
      
      // Store token
      await storageService.createToken({
        userId: user.id,
        token: otp,
        type: TokenType.OTP_EMAIL,
        expiresAt,
        used: false,
      });
      
      // Get email template
      const templateName = 'emailOtp';
      const template = i18n.getTemplate(templateName);
      
      // Render template with variables
      const renderedTemplate = i18n.renderTemplate(template, {
        otp,
        expiryMinutes: expiresIn.toString(),
        ...options.templateVars
      });
      
      // Send email - use rendered template as both text and HTML
      const subject = i18n.t('auth.otp.subject');
      // Using public method sendMail instead of private sendEmail
      const success = await emailService.sendMail(email, subject, renderedTemplate, renderedTemplate);
      
      // Emit event
      events.emitAuthEvent(AUTH_EVENTS.OTP_SENT, {
        timestamp: new Date(),
        userId: user.id,
        ip: undefined,
        userAgent: undefined
      });
      
      return {
        success,
        message: success ? 'OTP sent successfully' : 'Failed to send OTP',
      };
    } catch (error: any) {
      console.error('Error sending email OTP:', error);
      return {
        success: false,
        message: `Failed to send OTP: ${error?.message || 'Unknown error'}`,
      };
    }
  }
  
  /**
   * Send an OTP to a user's phone via SMS
   * @param phone User's phone number
   * @param options OTP options
   * @returns Result of the operation
   */
  async sendSmsOTP(
    phone: string,
    options: OtpOptions = {}
  ): Promise<AuthResponse> {
    try {
      // Find or create user
      let user = await storageService.findUserByPhone(phone);
      
      if (!user) {
        user = await storageService.createUser({
          phone,
          verified: false,
        });
      }
      
      // Generate OTP
      const length = options.length || config.security.otpLength;
      const otp = generateNumericToken(length);
      const expiresIn = options.expiresIn || config.security.otpExpiryMinutes;
      const expiresAt = new Date(Date.now() + expiresIn * 60 * 1000);
      
      // Store token
      await storageService.createToken({
        userId: user.id,
        token: otp,
        type: TokenType.OTP_SMS,
        expiresAt,
        used: false,
      });
      
      // Prepare message
      const message = i18n.t('auth.otp.body') + ' ' + otp;
      
      // Send SMS using the correct method name
      const success = await smsService.sendMessage(phone, message);
      
      // Emit event
      events.emitAuthEvent(AUTH_EVENTS.OTP_SENT, {
        timestamp: new Date(),
        userId: user.id,
        ip: undefined,
        userAgent: undefined
      });
      
      return {
        success,
        message: success ? 'OTP sent successfully' : 'Failed to send OTP',
      };
    } catch (error: any) {
      console.error('Error sending SMS OTP:', error);
      return {
        success: false,
        message: `Failed to send OTP: ${error?.message || 'Unknown error'}`,
      };
    }
  }
  
  /**
   * Verify a magic link token
   * @param token Magic link token
   * @returns Result of the verification
   */
  async verifyMagicLink(token: string): Promise<VerificationResult> {
    try {
      // Find token
      const tokenRecord = await storageService.findTokenByToken(token);
      
      if (!tokenRecord) {
        return {
          success: false,
          message: 'Invalid token',
        };
      }
      
      // Check if token is expired
      const now = new Date();
      if (tokenRecord.expiresAt < now) {
        return {
          success: false,
          message: 'Token has expired',
        };
      }
      
      // Check if token has been used
      if (tokenRecord.used) {
        return {
          success: false,
          message: 'Token has already been used',
        };
      }
      
      // Find user
      const user = await storageService.findUserById(tokenRecord.userId);
      
      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }
      
      // Mark token as used
      await storageService.updateToken(tokenRecord.id, { used: true });
      
      // Mark user as verified if not already
      if (!user.verified) {
        await storageService.updateUser(user.id, { verified: true });
      }
      
      // Create session token
      const sessionToken = this.createJwtToken({ 
        id: user.id, 
        email: user.email 
      });
      
      // Emit event
      events.emitAuthEvent(AUTH_EVENTS.LOGIN_SUCCESS, {
        timestamp: new Date(),
        userId: user.id,
        ip: undefined,
        userAgent: undefined
      });
      
      return {
        success: true,
        message: 'Token verified successfully',
        user,
        token: sessionToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      };
    } catch (error: any) {
      console.error('Error verifying magic link:', error);
      return {
        success: false,
        message: `Failed to verify token: ${error?.message || 'Unknown error'}`,
      };
    }
  }
  
  /**
   * Verify an OTP (email or SMS)
   * @param email User's email address (optional)
   * @param phone User's phone number (optional)
   * @param otp One-time password
   * @returns Result of the verification
   */
  async verifyOTP(
    email?: string,
    phone?: string,
    otp?: string
  ): Promise<VerificationResult> {
    try {
      if (!otp) {
        return {
          success: false,
          message: 'OTP is required',
        };
      }
      
      if (!email && !phone) {
        return {
          success: false,
          message: 'Email or phone is required',
        };
      }
      
      // Find user by email or phone
      const user = email 
        ? await storageService.findUserByEmail(email)
        : await storageService.findUserByPhone(phone!);
      
      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }
      
      // Find token
      const tokenRecord = await storageService.findTokenByToken(otp);
      
      if (!tokenRecord) {
        return {
          success: false,
          message: 'Invalid OTP',
        };
      }
      
      // Check if token belongs to the user
      if (tokenRecord.userId !== user.id) {
        return {
          success: false,
          message: 'Invalid OTP',
        };
      }
      
      // Check token type
      const tokenType = email ? TokenType.OTP_EMAIL : TokenType.OTP_SMS;
      if (tokenRecord.type !== tokenType) {
        return {
          success: false,
          message: 'Invalid OTP type',
        };
      }
      
      // Check if token is expired
      const now = new Date();
      if (tokenRecord.expiresAt < now) {
        return {
          success: false,
          message: 'OTP has expired',
        };
      }
      
      // Check if token has been used
      if (tokenRecord.used) {
        return {
          success: false,
          message: 'OTP has already been used',
        };
      }
      
      // Mark token as used
      await storageService.updateToken(tokenRecord.id, { used: true });
      
      // Mark user as verified if not already
      if (!user.verified) {
        await storageService.updateUser(user.id, { verified: true });
      }
      
      // Create session token
      const sessionToken = this.createJwtToken({ 
        id: user.id, 
        email: user.email,
        phone: user.phone
      });
      
      // Emit event
      events.emitAuthEvent(AUTH_EVENTS.LOGIN_SUCCESS, {
        timestamp: new Date(),
        userId: user.id,
        ip: undefined,
        userAgent: undefined
      });
      
      return {
        success: true,
        message: 'OTP verified successfully',
        user,
        token: sessionToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      };
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      return {
        success: false,
        message: `Failed to verify OTP: ${error?.message || 'Unknown error'}`,
      };
    }
  }
  
  /**
   * Validate a JWT token
   * @param token JWT token
   * @returns User if token is valid, null otherwise
   */
  validateToken(token: string): any | null {
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      return decoded;
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Logout (invalidate token)
   * @param token JWT token
   * @returns Success status
   */
  async logout(token: string): Promise<boolean> {
    try {
      // In a real implementation, we would add the token to a blacklist
      // or remove the session from the database
      
      // For now, we'll just emit the logout event
      const user = this.validateToken(token);
      
      if (user) {
        events.emitAuthEvent(AUTH_EVENTS.LOGOUT, {
          timestamp: new Date(),
          userId: user.id,
          ip: undefined,
          userAgent: undefined
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error logging out:', error);
      return false;
    }
  }
  
  /**
   * Create a JWT token
   * @param payload Token payload
   * @param expiresIn Token expiration time
   * @returns JWT token
   */
  private createJwtToken(payload: object, expiresIn: string = '1d'): string {
    const jwtSecret = config.jwt.secret;
    
    // Create JWT token with type assertion to avoid TypeScript error
    const token = jwt.sign(
      payload,
      jwtSecret as jwt.Secret,
      { expiresIn } as jwt.SignOptions
    );
    
    return token;
  }
}

export default new AuthService(); 