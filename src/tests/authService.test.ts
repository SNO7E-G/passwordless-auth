import authService from '../services/authService';
import emailService from '../services/emailService';
import smsService from '../services/smsService';
import storageService from '../services/storageService';
import { TokenType, User, AuthToken } from '../interfaces';

// Mock dependencies
jest.mock('../services/emailService');
jest.mock('../services/smsService');
jest.mock('../services/storageService');
jest.mock('../utils/eventEmitter', () => ({
  emitAuthEvent: jest.fn(),
  AUTH_EVENTS: {
    MAGIC_LINK_SENT: 'auth.magicLink.sent',
    OTP_SENT: 'auth.otp.sent',
    TOKEN_VERIFIED: 'auth.token.verified',
    TOKEN_INVALID: 'auth.token.invalid',
    LOGIN_SUCCESS: 'auth.login.success',
    LOGIN_FAILED: 'auth.login.failed',
  }
}));

describe('AuthService', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup storage service mock implementation
    (storageService.findUserByEmail as jest.Mock).mockImplementation((email: string) => {
      if (email === 'existing@example.com') {
        return Promise.resolve({
          id: 'user-1',
          email: 'existing@example.com',
          verified: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      return Promise.resolve(null);
    });
    
    (storageService.findUserByPhone as jest.Mock).mockImplementation((phone: string) => {
      if (phone === '+1234567890') {
        return Promise.resolve({
          id: 'user-2',
          phone: '+1234567890',
          verified: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      return Promise.resolve(null);
    });
    
    (storageService.createUser as jest.Mock).mockImplementation((userData: Partial<User>) => {
      return Promise.resolve({
        id: 'new-user-id',
        ...userData,
        verified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });
    
    (storageService.createToken as jest.Mock).mockResolvedValue({
      id: 'token-1',
      token: 'test-token',
      used: false,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    (emailService.sendEmail as jest.Mock).mockResolvedValue(true);
    (smsService.sendSms as jest.Mock).mockResolvedValue(true);
  });
  
  describe('sendMagicLink', () => {
    it('should send a magic link to an existing user', async () => {
      const result = await authService.sendMagicLink('existing@example.com');
      
      expect(result.success).toBe(true);
      expect(storageService.findUserByEmail).toHaveBeenCalledWith('existing@example.com');
      expect(storageService.createToken).toHaveBeenCalled();
      expect(emailService.sendEmail).toHaveBeenCalled();
    });
    
    it('should create a new user when sending a magic link to a non-existent user', async () => {
      const result = await authService.sendMagicLink('new@example.com');
      
      expect(result.success).toBe(true);
      expect(storageService.findUserByEmail).toHaveBeenCalledWith('new@example.com');
      expect(storageService.createUser).toHaveBeenCalled();
      expect(storageService.createToken).toHaveBeenCalled();
      expect(emailService.sendEmail).toHaveBeenCalled();
    });
    
    it('should handle email service failure', async () => {
      (emailService.sendEmail as jest.Mock).mockRejectedValueOnce(new Error('Email service error'));
      
      const result = await authService.sendMagicLink('existing@example.com');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to send magic link');
    });
  });
  
  describe('sendEmailOTP', () => {
    it('should send an OTP to an existing user email', async () => {
      const result = await authService.sendEmailOTP('existing@example.com');
      
      expect(result.success).toBe(true);
      expect(storageService.findUserByEmail).toHaveBeenCalledWith('existing@example.com');
      expect(storageService.createToken).toHaveBeenCalled();
      expect(emailService.sendEmail).toHaveBeenCalled();
    });
    
    it('should create a new user when sending an OTP to a non-existent email', async () => {
      const result = await authService.sendEmailOTP('new@example.com');
      
      expect(result.success).toBe(true);
      expect(storageService.findUserByEmail).toHaveBeenCalledWith('new@example.com');
      expect(storageService.createUser).toHaveBeenCalled();
      expect(storageService.createToken).toHaveBeenCalled();
      expect(emailService.sendEmail).toHaveBeenCalled();
    });
  });
  
  describe('sendSmsOTP', () => {
    it('should send an OTP to an existing user phone', async () => {
      const result = await authService.sendSmsOTP('+1234567890');
      
      expect(result.success).toBe(true);
      expect(storageService.findUserByPhone).toHaveBeenCalledWith('+1234567890');
      expect(storageService.createToken).toHaveBeenCalled();
      expect(smsService.sendSms).toHaveBeenCalled();
    });
    
    it('should create a new user when sending an OTP to a non-existent phone', async () => {
      const result = await authService.sendSmsOTP('+9876543210');
      
      expect(result.success).toBe(true);
      expect(storageService.findUserByPhone).toHaveBeenCalledWith('+9876543210');
      expect(storageService.createUser).toHaveBeenCalled();
      expect(storageService.createToken).toHaveBeenCalled();
      expect(smsService.sendSms).toHaveBeenCalled();
    });
  });
  
  describe('verifyMagicLink', () => {
    beforeEach(() => {
      (storageService.findTokenByToken as jest.Mock).mockImplementation((token: string) => {
        if (token === 'valid-token') {
          return Promise.resolve({
            id: 'token-1',
            userId: 'user-1',
            token: 'valid-token',
            type: TokenType.MAGIC_LINK,
            expiresAt: new Date(Date.now() + 1000 * 60 * 15), // 15 minutes in the future
            used: false,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        } else if (token === 'expired-token') {
          return Promise.resolve({
            id: 'token-2',
            userId: 'user-1',
            token: 'expired-token',
            type: TokenType.MAGIC_LINK,
            expiresAt: new Date(Date.now() - 1000 * 60), // 1 minute in the past
            used: false,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        } else if (token === 'used-token') {
          return Promise.resolve({
            id: 'token-3',
            userId: 'user-1',
            token: 'used-token',
            type: TokenType.MAGIC_LINK,
            expiresAt: new Date(Date.now() + 1000 * 60 * 15), // 15 minutes in the future
            used: true,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
        return Promise.resolve(null);
      });
      
      (storageService.findUserById as jest.Mock).mockImplementation((id: string) => {
        if (id === 'user-1') {
          return Promise.resolve({
            id: 'user-1',
            email: 'existing@example.com',
            verified: true,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
        return Promise.resolve(null);
      });
      
      (storageService.updateToken as jest.Mock).mockResolvedValue({
        id: 'token-1',
        used: true,
        updatedAt: new Date()
      });
    });
    
    it('should successfully verify a valid magic link token', async () => {
      const result = await authService.verifyMagicLink('valid-token');
      
      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.token).toBeDefined();
      expect(storageService.findTokenByToken).toHaveBeenCalledWith('valid-token');
      expect(storageService.updateToken).toHaveBeenCalled();
    });
    
    it('should fail for an expired token', async () => {
      const result = await authService.verifyMagicLink('expired-token');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('expired');
      expect(storageService.findTokenByToken).toHaveBeenCalledWith('expired-token');
      expect(storageService.updateToken).not.toHaveBeenCalled();
    });
    
    it('should fail for a used token', async () => {
      const result = await authService.verifyMagicLink('used-token');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('already been used');
      expect(storageService.findTokenByToken).toHaveBeenCalledWith('used-token');
      expect(storageService.updateToken).not.toHaveBeenCalled();
    });
    
    it('should fail for a non-existent token', async () => {
      const result = await authService.verifyMagicLink('non-existent-token');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('invalid');
      expect(storageService.findTokenByToken).toHaveBeenCalledWith('non-existent-token');
      expect(storageService.updateToken).not.toHaveBeenCalled();
    });
  });
  
  describe('verifyOTP', () => {
    beforeEach(() => {
      (storageService.findTokenByToken as jest.Mock).mockImplementation((token: string) => {
        if (token === '123456' && (storageService.findUserByEmail as jest.Mock).mock.calls[0][0] === 'existing@example.com') {
          return Promise.resolve({
            id: 'token-otp-1',
            userId: 'user-1',
            token: '123456',
            type: TokenType.OTP_EMAIL,
            expiresAt: new Date(Date.now() + 1000 * 60 * 5), // 5 minutes in the future
            used: false,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        } else if (token === '123456' && (storageService.findUserByPhone as jest.Mock).mock.calls[0][0] === '+1234567890') {
          return Promise.resolve({
            id: 'token-otp-2',
            userId: 'user-2',
            token: '123456',
            type: TokenType.OTP_SMS,
            expiresAt: new Date(Date.now() + 1000 * 60 * 5), // 5 minutes in the future
            used: false,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
        return Promise.resolve(null);
      });
    });
    
    it('should successfully verify a valid email OTP', async () => {
      const result = await authService.verifyOTP('existing@example.com', undefined, '123456');
      
      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.token).toBeDefined();
      expect(storageService.findUserByEmail).toHaveBeenCalledWith('existing@example.com');
      expect(storageService.updateToken).toHaveBeenCalled();
    });
    
    it('should successfully verify a valid SMS OTP', async () => {
      const result = await authService.verifyOTP(undefined, '+1234567890', '123456');
      
      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.token).toBeDefined();
      expect(storageService.findUserByPhone).toHaveBeenCalledWith('+1234567890');
      expect(storageService.updateToken).toHaveBeenCalled();
    });
    
    it('should fail for a non-existent user', async () => {
      const result = await authService.verifyOTP('non-existent@example.com', undefined, '123456');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('User not found');
      expect(storageService.findUserByEmail).toHaveBeenCalledWith('non-existent@example.com');
      expect(storageService.updateToken).not.toHaveBeenCalled();
    });
    
    it('should fail for an invalid OTP', async () => {
      const result = await authService.verifyOTP('existing@example.com', undefined, 'invalid');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid OTP');
      expect(storageService.findUserByEmail).toHaveBeenCalledWith('existing@example.com');
      expect(storageService.updateToken).not.toHaveBeenCalled();
    });
  });
  
  describe('validateToken', () => {
    beforeEach(() => {
      // Mock JWT validation
      Object.defineProperty(authService, 'validateToken', {
        value: jest.fn().mockImplementation((token: string) => {
          if (token === 'valid-jwt-token') {
            return {
              id: 'user-1',
              email: 'existing@example.com'
            };
          }
          return null;
        })
      });
    });
    
    it('should validate a valid JWT token', () => {
      const user = authService.validateToken('valid-jwt-token');
      
      expect(user).toBeDefined();
      expect(user.id).toBe('user-1');
      expect(user.email).toBe('existing@example.com');
    });
    
    it('should return null for an invalid JWT token', () => {
      const user = authService.validateToken('invalid-jwt-token');
      
      expect(user).toBeNull();
    });
  });
  
  // Additional tests for other auth methods can be added here
}); 