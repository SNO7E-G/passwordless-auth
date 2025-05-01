# Security Best Practices

This document outlines essential security best practices for implementing passwordless authentication using our library. Following these guidelines will help you secure your authentication system against common threats.

## Table of Contents

- [Transport Layer Security](#transport-layer-security)
- [Token Security](#token-security)
- [Rate Limiting and Brute Force Protection](#rate-limiting-and-brute-force-protection)
- [Session Management](#session-management)
- [Email and SMS Security](#email-and-sms-security)
- [WebAuthn Implementation](#webauthn-implementation)
- [Storage Security](#storage-security)
- [Multi-factor Authentication](#multi-factor-authentication)
- [Logging and Monitoring](#logging-and-monitoring)
- [Additional Security Measures](#additional-security-measures)

## Transport Layer Security

### Always Use HTTPS

All authentication endpoints and client-server communication must use HTTPS to prevent man-in-the-middle attacks and credential theft.

```typescript
// For Express.js applications
import express from 'express';
import helmet from 'helmet';

const app = express();

// Enforce HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}

// Use Helmet to set security headers
app.use(helmet());
```

### HTTP Security Headers

Implement security headers to protect against various attacks:

```typescript
// Use Helmet to set secure headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'", "https://your-api.com"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"]
      }
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    frameguard: {
      action: 'deny'
    }
  })
);
```

## Token Security

### JWT Configuration

When using JWT tokens for authentication:

1. Use strong, unique secrets for signing tokens
2. Set appropriate expiration times
3. Include only necessary claims in the payload
4. Consider using asymmetric signing (RS256) for production environments

```typescript
// In your environment configuration
// .env
JWT_SECRET=your-very-complex-secret-key-at-least-32-characters
JWT_EXPIRES_IN=1h
JWT_ALGORITHM=HS256 # or RS256 for asymmetric signing

// In your code
import jwt from 'jsonwebtoken';
import { readFileSync } from 'fs';

// For symmetric signing (HS256)
const jwtSecret = process.env.JWT_SECRET;

// For asymmetric signing (RS256)
// const privateKey = readFileSync('path/to/private.key');

function generateToken(user) {
  return jwt.sign(
    { 
      sub: user.id,
      // Only include claims you need
      email: user.email
    },
    jwtSecret,
    { 
      algorithm: process.env.JWT_ALGORITHM,
      expiresIn: process.env.JWT_EXPIRES_IN
    }
  );
}
```

### Token Storage

Advise clients on proper token storage:

1. For web apps: Use HttpOnly cookies with secure and SameSite attributes
2. For mobile apps: Use secure device storage like Keychain (iOS) or KeyStore (Android)
3. Avoid storing tokens in localStorage or sessionStorage due to XSS vulnerability

```typescript
// Express.js example of secure cookie usage
app.post('/auth/login', async (req, res) => {
  // Authentication logic...
  // After successful authentication:
  
  const token = generateToken(user);
  
  res.cookie('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 3600000, // 1 hour in milliseconds
    path: '/'
  });
  
  res.json({ success: true, message: 'Login successful' });
});
```

## Rate Limiting and Brute Force Protection

Implement rate limiting on all authentication endpoints to prevent brute force attacks:

```typescript
import rateLimit from 'express-rate-limit';

// Global rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});

app.use(globalLimiter);

// Stricter rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 auth attempts per windowMs
  message: 'Too many authentication attempts, please try again later'
});

app.use('/auth', authLimiter);
```

### Progressive Delays

Implement increasing delays on consecutive failed authentication attempts:

```typescript
import { storageService } from 'passwordless-auth';

async function handleLoginAttempt(email, isSuccess) {
  const user = await storageService.findUserByEmail(email);
  
  if (!isSuccess && user) {
    // Increment failed attempts
    user.failedAttempts = (user.failedAttempts || 0) + 1;
    user.lastFailedAttempt = new Date();
    
    await storageService.updateUser(user.id, {
      failedAttempts: user.failedAttempts,
      lastFailedAttempt: user.lastFailedAttempt
    });
    
    // Lock account after too many failed attempts
    if (user.failedAttempts >= 5) {
      await storageService.updateUser(user.id, {
        locked: true,
        lockedUntil: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
      });
    }
  } else if (isSuccess && user) {
    // Reset failed attempts on success
    await storageService.updateUser(user.id, {
      failedAttempts: 0,
      lastFailedAttempt: null,
      locked: false,
      lockedUntil: null
    });
  }
}
```

## Session Management

### Session Expiry

Set appropriate expiration times for sessions and implement automatic logout:

```typescript
// Short-lived sessions for high-security applications
const sessionOptions = {
  expiresIn: '1h', // 1 hour
  refreshToken: true, // Enable token refresh
  refreshThreshold: '10m', // Refresh when token is 10 minutes from expiry
  inactivityTimeout: '30m' // Logout after 30 minutes of inactivity
};

// Monitor user activity to extend session
function setupActivityMonitoring() {
  const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
  let lastActivity = Date.now();
  
  events.forEach(event => {
    window.addEventListener(event, () => {
      lastActivity = Date.now();
    });
  });
  
  // Check inactivity every minute
  setInterval(() => {
    const inactiveTime = Date.now() - lastActivity;
    if (inactiveTime > sessionOptions.inactivityTimeout) {
      // Logout user
      logout();
    }
  }, 60000);
}
```

### Secure Session Termination

Properly invalidate sessions on logout:

```typescript
app.post('/auth/logout', async (req, res) => {
  const token = req.cookies.auth_token;
  
  if (token) {
    // Invalidate the token in the database
    await authService.logout(token);
    
    // Clear the cookie
    res.clearCookie('auth_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    });
  }
  
  res.json({ success: true, message: 'Logged out successfully' });
});
```

## Email and SMS Security

### Email Security

1. Verify email providers' security practices
2. Use SPF, DKIM, and DMARC to prevent email spoofing
3. Include information in emails to help users identify phishing attempts

```typescript
// Example of sending a secure magic link email
async function sendSecureMagicLinkEmail(email, token) {
  const magicLinkUrl = `https://your-app.com/verify?token=${token}`;
  
  const emailBody = `
    <p>Hello,</p>
    <p>Click the button below to sign in to your account:</p>
    <p><a href="${magicLinkUrl}" style="padding: 10px 15px; background: #4285f4; color: white; text-decoration: none; border-radius: 4px;">Sign In</a></p>
    <p>The link will expire in 15 minutes.</p>
    <p>If you didn't request this link, please ignore this email.</p>
    <p>For security reasons, we never ask for your password or personal information via email.</p>
    <hr>
    <p style="color: #666; font-size: 12px;">This email was sent from Your App Name because someone tried to sign in with your email address. If this wasn't you, you can safely ignore this email.</p>
  `;
  
  return emailService.sendMail(
    email,
    'Sign in to Your App',
    emailBody
  );
}
```

### SMS Security

1. Use reputable SMS providers with proper security measures
2. Include minimal information in SMS messages
3. Do not include company name and URL in the same SMS (to prevent phishing)

```typescript
// Example of sending a secure OTP SMS
async function sendSecureOtpSms(phone, otp) {
  const message = `Your verification code is: ${otp}. It will expire in 5 minutes. Never share this code with anyone.`;
  
  return smsService.sendMessage(phone, message);
}
```

## WebAuthn Implementation

Follow these guidelines when implementing WebAuthn:

1. Verify the origin of WebAuthn responses
2. Store credential IDs and public keys securely
3. Implement proper user verification
4. Support multiple devices per user

```typescript
// Example of proper WebAuthn credential verification
async function verifyWebAuthnAssertion(assertion, expectedChallenge) {
  // 1. Verify that the origin matches your application
  if (assertion.response.clientDataJSON.origin !== 'https://your-app.com') {
    throw new Error('Invalid origin in WebAuthn response');
  }
  
  // 2. Verify that the challenge matches what you sent
  if (assertion.response.clientDataJSON.challenge !== expectedChallenge) {
    throw new Error('Invalid challenge in WebAuthn response');
  }
  
  // 3. Verify the signature using the stored public key
  const isValid = await webAuthnService.verifySignature(
    assertion.id,
    assertion.response.signature,
    assertion.response.authenticatorData
  );
  
  if (!isValid) {
    throw new Error('Invalid signature');
  }
  
  return true;
}
```

## Storage Security

### Database Security

1. Use parameterized queries to prevent SQL injection
2. Apply the principle of least privilege to database users
3. Encrypt sensitive data at rest

```typescript
// Example of secure database access with MongoDB
class SecureMongoAdapter {
  constructor(options) {
    this.client = new MongoClient(options.uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Enable TLS/SSL for MongoDB connections
      ssl: true,
      sslValidate: true,
      sslCA: options.sslCA
    });
    
    this.db = null;
  }
  
  async connect() {
    await this.client.connect();
    this.db = this.client.db();
    console.log('Connected to MongoDB securely');
  }
  
  // Implement secure methods...
}
```

### Sensitive Data Encryption

Encrypt sensitive user data and tokens:

```typescript
import crypto from 'crypto';

class EncryptionService {
  constructor(encryptionKey) {
    this.algorithm = 'aes-256-gcm';
    this.key = Buffer.from(encryptionKey, 'hex');
  }
  
  encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag().toString('hex');
    
    return {
      iv: iv.toString('hex'),
      encrypted,
      authTag
    };
  }
  
  decrypt(encrypted, iv, authTag) {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.key,
      Buffer.from(iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

// Usage
const encryptionService = new EncryptionService(process.env.ENCRYPTION_KEY);

// Encrypt sensitive data before storing
async function storeUserData(user) {
  if (user.phone) {
    const { iv, encrypted, authTag } = encryptionService.encrypt(user.phone);
    user.phone = undefined; // Remove plaintext
    user.encryptedPhone = encrypted;
    user.phoneIv = iv;
    user.phoneAuthTag = authTag;
  }
  
  return storageService.createUser(user);
}
```

## Multi-factor Authentication

### Implementation Best Practices

1. Offer multiple MFA options (TOTP, SMS, WebAuthn)
2. Allow users to manage their MFA methods
3. Implement secure recovery flows

```typescript
// Example of requiring MFA based on risk assessment
async function handleLogin(user, context) {
  // Assess risk based on user behavior and context
  const riskAssessment = await adaptiveAuthService.assessRisk(user.id, context);
  
  if (riskAssessment.score > 70) {
    // High-risk login, require MFA
    return {
      success: true,
      requireMfa: true,
      allowedFactors: ['totp', 'sms', 'webauthn'],
      sessionToken: generateTempToken(user.id)
    };
  } else {
    // Low-risk login, no MFA required
    return {
      success: true,
      requireMfa: false,
      token: generateToken(user.id)
    };
  }
}
```

### Backup Codes

Provide backup codes for account recovery:

```typescript
// Generate backup codes for a user
async function generateBackupCodes(userId) {
  const codes = [];
  
  // Generate 10 random backup codes
  for (let i = 0; i < 10; i++) {
    const code = crypto.randomBytes(5).toString('hex');
    codes.push(code);
  }
  
  // Hash the codes before storing them
  const hashedCodes = codes.map(code => {
    return crypto.createHash('sha256').update(code).digest('hex');
  });
  
  // Store hashed codes in the database
  await storageService.updateUser(userId, {
    backupCodes: hashedCodes
  });
  
  // Return plain text codes to show to the user (only once)
  return codes;
}
```

## Logging and Monitoring

### Security Event Logging

Implement comprehensive logging for security events:

```typescript
import { events, AUTH_EVENTS } from 'passwordless-auth';

// Log authentication events
events.on(AUTH_EVENTS.LOGIN_SUCCESS, (payload) => {
  logger.info('Login successful', {
    userId: payload.user.id,
    email: payload.user.email,
    ip: payload.ip,
    userAgent: payload.userAgent,
    timestamp: new Date().toISOString()
  });
});

events.on(AUTH_EVENTS.LOGIN_FAILED, (payload) => {
  logger.warn('Login failed', {
    email: payload.email,
    reason: payload.reason,
    ip: payload.ip,
    userAgent: payload.userAgent,
    timestamp: new Date().toISOString()
  });
});

events.on(AUTH_EVENTS.TOKEN_CREATED, (payload) => {
  logger.info('Token created', {
    userId: payload.userId,
    tokenType: payload.tokenType,
    expiresAt: payload.expiresAt,
    timestamp: new Date().toISOString()
  });
});

// Log suspicious activities
events.on(AUTH_EVENTS.RISK_ASSESSED, (payload) => {
  if (payload.score > 70) {
    logger.warn('High-risk authentication attempt', {
      userId: payload.userId,
      riskScore: payload.score,
      riskFactors: payload.factors,
      ip: payload.ip,
      timestamp: new Date().toISOString()
    });
  }
});
```

### Alerts for Suspicious Activity

Set up alerts for potentially malicious activities:

```typescript
// Example of setting up alerts for suspicious activities
function setupSecurityAlerts() {
  const alertThreshold = 3; // Number of failed attempts before alerting
  let failedAttempts = {};
  
  events.on(AUTH_EVENTS.LOGIN_FAILED, (payload) => {
    const { ip, email } = payload;
    const key = `${ip}:${email}`;
    
    // Track failed attempts
    failedAttempts[key] = (failedAttempts[key] || 0) + 1;
    
    // Check if threshold is exceeded
    if (failedAttempts[key] >= alertThreshold) {
      // Send alert
      sendSecurityAlert({
        type: 'brute_force_attempt',
        ip,
        email,
        attempts: failedAttempts[key],
        timestamp: new Date().toISOString()
      });
      
      // Reset counter
      failedAttempts[key] = 0;
    }
  });
  
  // Clean up tracking after some time
  setInterval(() => {
    failedAttempts = {};
  }, 24 * 60 * 60 * 1000); // 24 hours
}
```

## Additional Security Measures

### CSRF Protection

Implement Cross-Site Request Forgery protection:

```typescript
import csrf from 'csurf';

// Set up CSRF protection middleware
const csrfProtection = csrf({ cookie: {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict'
}});

// Apply to routes that change state
app.post('/auth/login', csrfProtection, loginController);
app.post('/auth/register', csrfProtection, registerController);
app.post('/auth/change-email', csrfProtection, changeEmailController);

// Provide CSRF token to client
app.get('/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});
```

### Adaptive Authentication

Implement risk-based adaptive authentication:

```typescript
// Example of adaptive authentication implementation
async function adaptiveAuthentication(user, context) {
  // Collect context information
  const contextData = {
    ip: context.ip,
    userAgent: context.userAgent,
    location: await getLocationFromIp(context.ip),
    time: new Date(),
    deviceId: context.deviceId
  };
  
  // Check if device is known
  const isKnownDevice = await adaptiveAuthService.isTrustedDevice(
    user.id,
    contextData.deviceId
  );
  
  // Check for location anomalies
  const locationAnomaly = await detectLocationAnomaly(user.id, contextData.location);
  
  // Check for time anomalies (unusual login times)
  const timeAnomaly = detectTimeAnomaly(user.id, contextData.time);
  
  // Calculate risk score (0-100)
  let riskScore = 0;
  
  if (!isKnownDevice) riskScore += 40;
  if (locationAnomaly) riskScore += 30;
  if (timeAnomaly) riskScore += 20;
  
  // Return risk assessment
  return {
    score: riskScore,
    factors: [
      !isKnownDevice ? 'unknown_device' : null,
      locationAnomaly ? 'location_change' : null,
      timeAnomaly ? 'unusual_time' : null
    ].filter(Boolean)
  };
}
```

### Account Takeover Prevention

Implement measures to prevent account takeover:

```typescript
// Notify users about critical account changes
async function notifyUserOfAccountChange(userId, changeType) {
  const user = await storageService.findUserById(userId);
  
  if (!user) return;
  
  const changeMessages = {
    email_change: 'Your email address has been changed.',
    password_reset: 'A password reset was requested for your account.',
    mfa_disabled: 'Multi-factor authentication has been disabled for your account.',
    login_new_device: 'There was a login to your account from a new device.'
  };
  
  const message = changeMessages[changeType] || 'There was a change to your account.';
  
  // Send email to both new and old email addresses if email was changed
  if (changeType === 'email_change' && user.previousEmail) {
    await emailService.sendMail(
      user.previousEmail,
      'Important: Your account email has been changed',
      `${message} If you did not make this change, please contact support immediately.`
    );
  }
  
  // Send notification to current email
  await emailService.sendMail(
    user.email,
    'Account Security Notification',
    `${message} If you did not make this change, please contact support immediately.`
  );
}
```

By following these security best practices, you can create a robust and secure passwordless authentication system that protects your users and their data. 