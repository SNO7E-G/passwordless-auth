# Code Examples

This document provides code examples for common use cases of the Passwordless Authentication Library.

## Table of Contents
- [Basic Authentication](#basic-authentication)
- [Magic Link Authentication](#magic-link-authentication)
- [Email OTP Authentication](#email-otp-authentication)
- [SMS OTP Authentication](#sms-otp-authentication)
- [TOTP Authentication](#totp-authentication)
- [WebAuthn Authentication](#webauthn-authentication)
- [Multi-factor Authentication](#multi-factor-authentication)
- [Custom Storage Integration](#custom-storage-integration)

## Basic Authentication

### Setting Up Authentication Service

```typescript
import { authService, emailService, smsService, storageService } from 'passwordless-auth';
import { MongoDbAdapter } from 'passwordless-auth/adapters';

// Configure storage
const storageAdapter = new MongoDbAdapter({
  uri: process.env.MONGODB_URI,
  userCollection: 'users',
  tokenCollection: 'tokens',
  sessionCollection: 'sessions'
});

storageService.useAdapter(storageAdapter);

// Configure email service
emailService.configure({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT, 10),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  from: process.env.EMAIL_FROM
});

// Configure SMS service
smsService.configure({
  provider: process.env.SMS_PROVIDER,
  accountSid: process.env.TWILIO_ACCOUNT_SID,
  authToken: process.env.TWILIO_AUTH_TOKEN,
  phoneNumber: process.env.TWILIO_PHONE_NUMBER
});

// Initialize
(async () => {
  try {
    await storageService.connect();
    console.log('Connected to storage');
  } catch (err) {
    console.error('Failed to connect to storage:', err);
  }
})();
```

## Magic Link Authentication

### Sending a Magic Link

```typescript
import { authService } from 'passwordless-auth';

async function sendLoginMagicLink(email) {
  try {
    const result = await authService.sendMagicLink(email, {
      redirectUrl: 'https://your-app.com/auth/callback',
      expiresIn: 15 * 60 * 1000, // 15 minutes
      subject: 'Sign in to Your App',
      templateName: 'magic-link' // Optional custom template
    });

    return { success: true, message: 'Magic link sent' };
  } catch (error) {
    console.error('Failed to send magic link:', error);
    return { success: false, message: error.message };
  }
}
```

### Verifying a Magic Link

```typescript
import { authService } from 'passwordless-auth';

async function verifyMagicLink(token) {
  try {
    const result = await authService.verifyMagicLink(token);
    
    if (result.success) {
      // User is authenticated
      return {
        success: true,
        user: result.user,
        token: result.token
      };
    } else {
      return { success: false, message: result.message };
    }
  } catch (error) {
    console.error('Failed to verify magic link:', error);
    return { success: false, message: error.message };
  }
}
```

### Express.js Magic Link Implementation

```typescript
import express from 'express';
import { authService } from 'passwordless-auth';

const app = express();
app.use(express.json());

// Send magic link
app.post('/auth/magic-link', async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required'
    });
  }
  
  try {
    const result = await authService.sendMagicLink(email, {
      redirectUrl: `${process.env.BASE_URL}/auth/callback`,
      expiresIn: 15 * 60 * 1000 // 15 minutes
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Verify magic link (callback route)
app.get('/auth/callback', (req, res) => {
  const { token } = req.query;
  
  if (!token) {
    return res.status(400).send('Invalid or missing token');
  }
  
  // Show a page that will verify the token
  res.send(`
    <html>
      <head>
        <title>Verifying...</title>
        <script>
          // Client-side code to verify the token
          fetch('/auth/verify-magic-link', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: '${token}' })
          })
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              // Store the token and redirect
              localStorage.setItem('auth_token', data.token);
              window.location.href = '/dashboard';
            } else {
              document.body.innerHTML = '<h1>Verification failed</h1><p>' + data.message + '</p>';
            }
          });
        </script>
      </head>
      <body>
        <h1>Verifying your login...</h1>
        <p>Please wait...</p>
      </body>
    </html>
  `);
});

// API endpoint to verify the token
app.post('/auth/verify-magic-link', async (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Token is required'
    });
  }
  
  try {
    const result = await authService.verifyMagicLink(token);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});
```

## Email OTP Authentication

### Sending an Email OTP

```typescript
import { authService } from 'passwordless-auth';

async function sendEmailOTP(email) {
  try {
    const result = await authService.sendEmailOTP(email, {
      length: 6, // OTP length
      expiresIn: 5 * 60 * 1000, // 5 minutes
      algorithm: 'numeric', // 'numeric', 'alphanumeric', or 'sha1'
      subject: 'Your verification code'
    });
    
    return { success: true, message: 'OTP sent' };
  } catch (error) {
    console.error('Failed to send OTP:', error);
    return { success: false, message: error.message };
  }
}
```

### Verifying an Email OTP

```typescript
import { authService } from 'passwordless-auth';

async function verifyEmailOTP(email, otp) {
  try {
    const result = await authService.verifyOTP(email, undefined, otp);
    
    if (result.success) {
      // User is authenticated
      return {
        success: true,
        user: result.user,
        token: result.token
      };
    } else {
      return { success: false, message: result.message };
    }
  } catch (error) {
    console.error('Failed to verify OTP:', error);
    return { success: false, message: error.message };
  }
}
```

## SMS OTP Authentication

### Sending an SMS OTP

```typescript
import { authService } from 'passwordless-auth';

async function sendSmsOTP(phone) {
  try {
    const result = await authService.sendSmsOTP(phone, {
      length: 6, // OTP length
      expiresIn: 5 * 60 * 1000, // 5 minutes
      algorithm: 'numeric' // 'numeric' is best for SMS
    });
    
    return { success: true, message: 'OTP sent' };
  } catch (error) {
    console.error('Failed to send SMS OTP:', error);
    return { success: false, message: error.message };
  }
}
```

### Verifying an SMS OTP

```typescript
import { authService } from 'passwordless-auth';

async function verifySmsOTP(phone, otp) {
  try {
    const result = await authService.verifyOTP(undefined, phone, otp);
    
    if (result.success) {
      // User is authenticated
      return {
        success: true,
        user: result.user,
        token: result.token
      };
    } else {
      return { success: false, message: result.message };
    }
  } catch (error) {
    console.error('Failed to verify SMS OTP:', error);
    return { success: false, message: error.message };
  }
}
```

## TOTP Authentication

### Setting Up TOTP for a User

```typescript
import { totpService } from 'passwordless-auth';

async function setupTOTP(userId, username) {
  try {
    // Generate TOTP setup for the user
    const setup = totpService.generateTotpSetup(
      userId,
      'Your App Name', // Issuer
      username // Account name (usually email)
    );
    
    // Return the setup information to display to the user
    return {
      success: true,
      secretKey: setup.secret,
      qrCodeUrl: setup.qrCodeUrl,
      message: 'Scan the QR code with your authenticator app'
    };
  } catch (error) {
    console.error('Failed to set up TOTP:', error);
    return { success: false, message: error.message };
  }
}
```

### Verifying a TOTP Code

```typescript
import { totpService } from 'passwordless-auth';

async function verifyTOTP(userId, code) {
  try {
    // Verify the TOTP code
    const isValid = totpService.verifyTotp(userId, code);
    
    if (isValid) {
      return { success: true, message: 'TOTP verified successfully' };
    } else {
      return { success: false, message: 'Invalid TOTP code' };
    }
  } catch (error) {
    console.error('Failed to verify TOTP:', error);
    return { success: false, message: error.message };
  }
}
```

## WebAuthn Authentication

### Registering a WebAuthn Credential

```typescript
import { webAuthnService } from 'passwordless-auth';

// Step 1: Generate registration options (server-side)
async function generateWebAuthnRegistrationOptions(userId, username, displayName) {
  try {
    const options = webAuthnService.generateRegistrationOptions(
      userId,
      username,
      displayName
    );
    
    return { success: true, options };
  } catch (error) {
    console.error('Failed to generate WebAuthn registration options:', error);
    return { success: false, message: error.message };
  }
}

// Step 2: Verify registration (server-side)
async function verifyWebAuthnRegistration(userId, credential) {
  try {
    const result = await webAuthnService.verifyRegistration(userId, credential);
    
    if (result) {
      return { success: true, message: 'WebAuthn credential registered successfully' };
    } else {
      return { success: false, message: 'Failed to register WebAuthn credential' };
    }
  } catch (error) {
    console.error('Failed to verify WebAuthn registration:', error);
    return { success: false, message: error.message };
  }
}

// Client-side implementation (in browser)
async function registerWebAuthnCredential(userId, username, displayName) {
  try {
    // 1. Get registration options from the server
    const response = await fetch('/auth/webauthn/registration-options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, username, displayName })
    });
    
    const { options } = await response.json();
    
    // 2. Create credential using the browser's WebAuthn API
    const credential = await navigator.credentials.create({
      publicKey: options
    });
    
    // 3. Send the credential to the server for verification
    const verificationResponse = await fetch('/auth/webauthn/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        credential: {
          id: credential.id,
          rawId: Array.from(new Uint8Array(credential.rawId)),
          response: {
            clientDataJSON: Array.from(new Uint8Array(credential.response.clientDataJSON)),
            attestationObject: Array.from(new Uint8Array(credential.response.attestationObject))
          },
          type: credential.type
        }
      })
    });
    
    return await verificationResponse.json();
  } catch (error) {
    console.error('WebAuthn registration error:', error);
    return { success: false, message: error.message };
  }
}
```

### Authenticating with WebAuthn

```typescript
import { webAuthnService } from 'passwordless-auth';

// Step 1: Generate authentication options (server-side)
async function generateWebAuthnAuthenticationOptions(userId) {
  try {
    const options = webAuthnService.generateAuthenticationOptions(userId);
    
    return { success: true, options };
  } catch (error) {
    console.error('Failed to generate WebAuthn authentication options:', error);
    return { success: false, message: error.message };
  }
}

// Step 2: Verify authentication (server-side)
async function verifyWebAuthnAuthentication(userId, credential) {
  try {
    const result = await webAuthnService.verifyAuthentication(userId, credential);
    
    if (result) {
      // Generate an authentication token
      const token = await authService.createSession(userId);
      return { success: true, token, message: 'WebAuthn authentication successful' };
    } else {
      return { success: false, message: 'WebAuthn authentication failed' };
    }
  } catch (error) {
    console.error('Failed to verify WebAuthn authentication:', error);
    return { success: false, message: error.message };
  }
}

// Client-side implementation (in browser)
async function authenticateWithWebAuthn(userId) {
  try {
    // 1. Get authentication options from the server
    const response = await fetch('/auth/webauthn/authentication-options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    
    const { options } = await response.json();
    
    // 2. Get credential using the browser's WebAuthn API
    const assertion = await navigator.credentials.get({
      publicKey: options
    });
    
    // 3. Send the assertion to the server for verification
    const verificationResponse = await fetch('/auth/webauthn/authenticate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        credential: {
          id: assertion.id,
          rawId: Array.from(new Uint8Array(assertion.rawId)),
          response: {
            clientDataJSON: Array.from(new Uint8Array(assertion.response.clientDataJSON)),
            authenticatorData: Array.from(new Uint8Array(assertion.response.authenticatorData)),
            signature: Array.from(new Uint8Array(assertion.response.signature)),
            userHandle: assertion.response.userHandle ? 
              Array.from(new Uint8Array(assertion.response.userHandle)) : null
          },
          type: assertion.type
        }
      })
    });
    
    return await verificationResponse.json();
  } catch (error) {
    console.error('WebAuthn authentication error:', error);
    return { success: false, message: error.message };
  }
}
```

## Multi-factor Authentication

### Implementing Multi-factor Authentication Flow

```typescript
import { authService, adaptiveAuthService } from 'passwordless-auth';

// Step 1: First factor authentication (e.g., magic link)
async function firstFactorAuth(email) {
  try {
    // Send a magic link
    const result = await authService.sendMagicLink(email);
    return result;
  } catch (error) {
    console.error('First factor auth failed:', error);
    return { success: false, message: error.message };
  }
}

// Step 2: Verify first factor and check if second factor is needed
async function verifyFirstFactor(token) {
  try {
    // Verify magic link
    const result = await authService.verifyMagicLink(token);
    
    if (!result.success) {
      return { success: false, message: result.message };
    }
    
    // Get user from the result
    const { user } = result;
    
    // Check if MFA is required for this user
    if (user.totpEnabled || user.webAuthnCredentials?.length > 0) {
      // MFA is set up, require second factor
      return {
        success: true,
        requireSecondFactor: true,
        availableFactors: getAvailableFactors(user),
        tempToken: authService.generateTemporaryToken(user.id)
      };
    } else {
      // No MFA set up, complete authentication
      return {
        success: true,
        requireSecondFactor: false,
        user,
        token: result.token
      };
    }
  } catch (error) {
    console.error('First factor verification failed:', error);
    return { success: false, message: error.message };
  }
}

// Step 3: Verify second factor
async function verifySecondFactor(userId, factorType, factorData) {
  try {
    // Verify the second factor based on its type
    let isValid = false;
    
    switch (factorType) {
      case 'totp':
        isValid = await totpService.verifyTotp(userId, factorData.code);
        break;
      case 'webauthn':
        isValid = await webAuthnService.verifyAuthentication(userId, factorData.credential);
        break;
      // Add more factor types as needed
      default:
        return { success: false, message: 'Unsupported second factor type' };
    }
    
    if (isValid) {
      // Second factor verified, complete authentication
      const user = await storageService.findUserById(userId);
      const token = await authService.createSession(userId);
      
      return {
        success: true,
        user,
        token
      };
    } else {
      return { success: false, message: 'Second factor verification failed' };
    }
  } catch (error) {
    console.error('Second factor verification failed:', error);
    return { success: false, message: error.message };
  }
}

// Helper function to get available authentication factors for a user
function getAvailableFactors(user) {
  const factors = [];
  
  if (user.totpEnabled) {
    factors.push('totp');
  }
  
  if (user.webAuthnCredentials?.length > 0) {
    factors.push('webauthn');
  }
  
  return factors;
}
```

## Custom Storage Integration

### Creating a Custom Storage Adapter for MySQL

```typescript
import { StorageAdapter } from 'passwordless-auth';
import mysql from 'mysql2/promise';

class MySQLAdapter implements StorageAdapter {
  private pool: any;
  
  constructor(config: any) {
    this.pool = mysql.createPool({
      host: config.host,
      user: config.user,
      password: config.password,
      database: config.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }
  
  async connect(): Promise<void> {
    try {
      // Test the connection
      const connection = await this.pool.getConnection();
      connection.release();
      console.log('Connected to MySQL database');
    } catch (error) {
      console.error('Failed to connect to MySQL:', error);
      throw error;
    }
  }
  
  async disconnect(): Promise<void> {
    await this.pool.end();
  }
  
  // User methods
  async findUserById(id: string): Promise<any> {
    const [rows] = await this.pool.execute(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    
    return rows[0] || null;
  }
  
  async findUserByEmail(email: string): Promise<any> {
    const [rows] = await this.pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    return rows[0] || null;
  }
  
  async findUserByPhone(phone: string): Promise<any> {
    const [rows] = await this.pool.execute(
      'SELECT * FROM users WHERE phone = ?',
      [phone]
    );
    
    return rows[0] || null;
  }
  
  async createUser(userData: any): Promise<any> {
    const { email, phone, verified } = userData;
    
    const [result] = await this.pool.execute(
      'INSERT INTO users (email, phone, verified, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
      [email, phone, verified]
    );
    
    const userId = result.insertId;
    return this.findUserById(userId);
  }
  
  async updateUser(id: string, updates: any): Promise<any> {
    const fields = Object.keys(updates)
      .filter(key => key !== 'id')
      .map(key => `${key} = ?`);
    
    const values = Object.keys(updates)
      .filter(key => key !== 'id')
      .map(key => updates[key]);
    
    values.push(id);
    
    await this.pool.execute(
      `UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`,
      values
    );
    
    return this.findUserById(id);
  }
  
  // Token methods
  async findTokenById(id: string): Promise<any> {
    const [rows] = await this.pool.execute(
      'SELECT * FROM tokens WHERE id = ?',
      [id]
    );
    
    return rows[0] || null;
  }
  
  async findTokenByToken(token: string): Promise<any> {
    const [rows] = await this.pool.execute(
      'SELECT * FROM tokens WHERE token = ?',
      [token]
    );
    
    return rows[0] || null;
  }
  
  async createToken(tokenData: any): Promise<any> {
    const { userId, token, type, expiresAt, used, metadata } = tokenData;
    
    const [result] = await this.pool.execute(
      'INSERT INTO tokens (user_id, token, type, expires_at, used, metadata, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [userId, token, type, expiresAt, used || false, JSON.stringify(metadata || {})]
    );
    
    const tokenId = result.insertId;
    return this.findTokenById(tokenId);
  }
  
  async updateToken(id: string, updates: any): Promise<any> {
    const fields = Object.keys(updates)
      .filter(key => key !== 'id')
      .map(key => {
        if (key === 'metadata') {
          return `metadata = ?`;
        }
        return `${key} = ?`;
      });
    
    const values = Object.keys(updates)
      .filter(key => key !== 'id')
      .map(key => {
        if (key === 'metadata') {
          return JSON.stringify(updates[key] || {});
        }
        return updates[key];
      });
    
    values.push(id);
    
    await this.pool.execute(
      `UPDATE tokens SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`,
      values
    );
    
    return this.findTokenById(id);
  }
  
  // Session methods
  async findSessionById(id: string): Promise<any> {
    const [rows] = await this.pool.execute(
      'SELECT * FROM sessions WHERE id = ?',
      [id]
    );
    
    return rows[0] || null;
  }
  
  async findSessionByToken(token: string): Promise<any> {
    const [rows] = await this.pool.execute(
      'SELECT * FROM sessions WHERE token = ?',
      [token]
    );
    
    return rows[0] || null;
  }
  
  async createSession(sessionData: any): Promise<any> {
    const { userId, token, expiresAt, deviceInfo } = sessionData;
    
    const [result] = await this.pool.execute(
      'INSERT INTO sessions (user_id, token, expires_at, device_info, last_used_at, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW(), NOW())',
      [userId, token, expiresAt, JSON.stringify(deviceInfo || {})]
    );
    
    const sessionId = result.insertId;
    return this.findSessionById(sessionId);
  }
  
  async updateSession(id: string, updates: any): Promise<any> {
    const fields = Object.keys(updates)
      .filter(key => key !== 'id')
      .map(key => {
        if (key === 'deviceInfo') {
          return `device_info = ?`;
        }
        return `${key} = ?`;
      });
    
    const values = Object.keys(updates)
      .filter(key => key !== 'id')
      .map(key => {
        if (key === 'deviceInfo') {
          return JSON.stringify(updates[key] || {});
        }
        return updates[key];
      });
    
    values.push(id);
    
    await this.pool.execute(
      `UPDATE sessions SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`,
      values
    );
    
    return this.findSessionById(id);
  }
  
  async deleteSession(id: string): Promise<boolean> {
    const [result] = await this.pool.execute(
      'DELETE FROM sessions WHERE id = ?',
      [id]
    );
    
    return result.affectedRows > 0;
  }
}

// Usage example
import { storageService } from 'passwordless-auth';

const mysqlAdapter = new MySQLAdapter({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

storageService.useAdapter(mysqlAdapter);

(async () => {
  try {
    await storageService.connect();
    console.log('Connected to MySQL database');
  } catch (error) {
    console.error('Failed to connect to MySQL:', error);
  }
})();
``` 