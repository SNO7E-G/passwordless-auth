# API Documentation

## Table of Contents

- [Services](#services)
  - [Auth Service](#auth-service)
  - [OTP Service](#otp-service)
  - [Email Service](#email-service)
  - [SMS Service](#sms-service)
  - [TOTP Service](#totp-service)
  - [WebAuthn Service](#webauthn-service)
  - [Adaptive Auth Service](#adaptive-auth-service)
  - [Storage Service](#storage-service)
- [Utilities](#utilities)
  - [Event Emitter](#event-emitter)
  - [Internationalization (i18n)](#internationalization-i18n)
- [Interfaces](#interfaces)
- [Integrations](#integrations)
  - [Express Integration](#express-integration)
  - [React Integration](#react-integration)

## Services

### Auth Service

The core authentication service that handles magic links, OTP verification, and login sessions.

```typescript
import { authService } from 'passwordless-auth';
```

#### Methods

##### Magic Link Authentication

```typescript
// Send a magic link to user's email
async function sendMagicLink(email: string, options?: MagicLinkOptions): Promise<AuthResponse>

// Verify a magic link token
async function verifyMagicLink(token: string): Promise<VerificationResult>
```

##### OTP Authentication

```typescript
// Send an OTP via email
async function sendEmailOTP(email: string, options?: OtpOptions): Promise<AuthResponse>

// Send an OTP via SMS
async function sendSmsOTP(phone: string, options?: OtpOptions): Promise<AuthResponse>

// Verify an OTP (either email or SMS)
async function verifyOTP(
  email?: string, 
  phone?: string, 
  otp: string
): Promise<VerificationResult>
```

##### Token Management

```typescript
// Validate a JWT token
function validateToken(token: string): User | null

// Logout (invalidate token)
async function logout(token: string): Promise<boolean>
```

##### Multi-factor Authentication

```typescript
// Enable a second factor authentication method
async function enableSecondFactor(
  userId: string, 
  factorType: string, 
  factorData: any
): Promise<boolean>

// Verify a second authentication factor
async function verifySecondFactor(
  userId: string, 
  factorType: string, 
  factorData: any
): Promise<boolean>

// Disable a second factor authentication method
async function disableSecondFactor(
  userId: string, 
  factorType: string
): Promise<boolean>
```

### OTP Service

Handles one-time password generation and verification with support for multiple algorithms.

```typescript
import { otpService } from 'passwordless-auth';
```

#### Methods

```typescript
// Generate a new OTP
function generateOtp(length?: number, options?: OtpServiceOptions): string

// Validate an OTP
function validateOtp(otp: string, secret: string, options?: OtpServiceOptions): boolean

// Generate an OTP for a specific user
async function generateUserOtp(userId: string, options?: OtpServiceOptions): Promise<string>

// Verify an OTP for a specific user
async function verifyUserOtp(userId: string, otp: string): Promise<boolean>
```

### Email Service

Handles email delivery for magic links and email OTPs.

```typescript
import { emailService } from 'passwordless-auth';
```

#### Methods

```typescript
// Send an email
async function sendMail(
  to: string, 
  subject: string, 
  body: string, 
  options?: any
): Promise<boolean>

// Send a template-based email
async function sendTemplateMail(
  to: string, 
  templateName: string, 
  data: any, 
  options?: any
): Promise<boolean>
```

### SMS Service

Handles SMS delivery for OTPs.

```typescript
import { smsService } from 'passwordless-auth';
```

#### Methods

```typescript
// Send an SMS message
async function sendMessage(
  to: string, 
  message: string, 
  options?: any
): Promise<boolean>
```

### TOTP Service

Handles Time-based One-Time Password generation and verification.

```typescript
import { totpService } from 'passwordless-auth';
```

#### Methods

```typescript
// Generate TOTP setup for a user
function generateTotpSetup(
  userId: string, 
  issuer: string, 
  accountName: string
): TotpSetupResponse

// Verify a TOTP code
function verifyTotp(userId: string, token: string): boolean

// Disable TOTP for a user
async function disableTotp(userId: string): Promise<boolean>
```

### WebAuthn Service

Handles WebAuthn (FIDO2) authentication for biometrics and security keys.

```typescript
import { webAuthnService } from 'passwordless-auth';
```

#### Methods

```typescript
// Generate registration options for a new device
function generateRegistrationOptions(
  userId: string, 
  username: string, 
  displayName: string
): WebAuthnRegistrationOptions

// Verify WebAuthn registration
async function verifyRegistration(
  userId: string, 
  credential: WebAuthnCredential
): Promise<boolean>

// Generate authentication options
function generateAuthenticationOptions(userId: string): any

// Verify WebAuthn authentication
async function verifyAuthentication(
  userId: string, 
  credential: WebAuthnCredential
): Promise<boolean>
```

### Adaptive Auth Service

Provides risk-based authentication that adjusts security based on context.

```typescript
import { adaptiveAuthService } from 'passwordless-auth';
```

#### Methods

```typescript
// Assess login risk
async function assessRisk(
  userId: string, 
  contextData: any
): Promise<{ score: number, factors: string[] }>

// Register a new device as trusted
async function registerTrustedDevice(
  userId: string, 
  deviceId: string, 
  deviceInfo: any
): Promise<boolean>

// Check if a device is trusted
async function isTrustedDevice(
  userId: string, 
  deviceId: string
): Promise<boolean>
```

### Storage Service

Handles data persistence with support for different storage adapters.

```typescript
import { storageService } from 'passwordless-auth';
```

#### Methods

```typescript
// User management
async function findUserById(id: string): Promise<User>
async function findUserByEmail(email: string): Promise<User>
async function findUserByPhone(phone: string): Promise<User>
async function createUser(userData: any): Promise<User>
async function updateUser(id: string, updates: any): Promise<User>

// Token management
async function findTokenById(id: string): Promise<AuthToken>
async function findTokenByToken(token: string): Promise<AuthToken>
async function createToken(tokenData: any): Promise<AuthToken>
async function updateToken(id: string, updates: any): Promise<AuthToken>

// Session management
async function findSessionById(id: string): Promise<Session>
async function findSessionByToken(token: string): Promise<Session>
async function createSession(sessionData: any): Promise<Session>
async function updateSession(id: string, updates: any): Promise<Session>
async function deleteSession(id: string): Promise<boolean>

// Storage adapter management
async function connect(): Promise<void>
async function disconnect(): Promise<void>
```

## Utilities

### Event Emitter

System for subscribing to authentication events.

```typescript
import { events, AUTH_EVENTS } from 'passwordless-auth';
```

#### Events

- `USER_CREATED`: Emitted when a new user is created
- `USER_UPDATED`: Emitted when a user is updated
- `LOGIN_SUCCESS`: Emitted when a user successfully logs in
- `LOGIN_FAILED`: Emitted when a login attempt fails
- `TOKEN_CREATED`: Emitted when a new token is created
- `TOKEN_REVOKED`: Emitted when a token is revoked
- `RISK_ASSESSED`: Emitted when a risk assessment is performed

#### Methods

```typescript
// Subscribe to an event
function on(event: string, listener: Function): void

// Unsubscribe from an event
function off(event: string, listener: Function): void

// Emit an event
function emit(event: string, payload: any): void
```

### Internationalization (i18n)

Utilities for localizing messages and templates.

```typescript
import { i18n } from 'passwordless-auth';
```

#### Methods

```typescript
// Set the current locale
function setLocale(locale: string): void

// Get a translated message
function t(key: string, replacements?: Record<string, any>): string

// Get a translated template
function template(key: string, data?: Record<string, any>): string
```

## Interfaces

Key types and interfaces used throughout the library.

```typescript
import * as types from 'passwordless-auth';
```

### User

```typescript
interface User {
  id: string;
  email?: string;
  phone?: string;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
  totpEnabled?: boolean;
  totpSecret?: string;
  webAuthnCredentials?: WebAuthnCredential[];
  [key: string]: any;
}
```

### AuthToken

```typescript
interface AuthToken {
  id: string;
  userId: string;
  token: string;
  type: TokenType; // 'magic-link', 'otp', 'session'
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  used?: boolean;
  metadata?: Record<string, any>;
}
```

### Session

```typescript
interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  deviceInfo?: Record<string, any>;
  lastUsedAt?: Date;
}
```

## Integrations

### Express Integration

Integration with Express.js framework.

```typescript
import { express as passwordlessExpress } from 'passwordless-auth';
```

#### Middleware

```typescript
// Middleware to protect routes
function requireAuth(options?: any): RequestHandler

// Middleware to check for optional authentication
function optionalAuth(options?: any): RequestHandler

// Middleware for rate limiting
function rateLimiter(options?: any): RequestHandler
```

#### Router

```typescript
// Create an Express router with auth endpoints
function createAuthRouter(options?: any): Router
```

### React Integration

Integration with React framework.

```typescript
import { react as passwordlessReact } from 'passwordless-auth';
```

#### Components

```typescript
// Magic Link Form Component
<MagicLinkForm onSuccess={handleSuccess} redirectUrl="/dashboard" />

// OTP Form Component
<OtpForm 
  method="email" // or "sms"
  onSuccess={handleSuccess} 
/>

// TOTP Setup Component
<TotpSetup userId={currentUser.id} onSuccess={handleSuccess} />

// WebAuthn Registration Component
<WebAuthnRegistration userId={currentUser.id} onSuccess={handleSuccess} />
```

#### Hooks

```typescript
// Hook for current user
const { user, loading, error } = useUser();

// Hook for authentication
const { login, logout, isAuthenticated } = useAuth();

// Hook for magic link
const { sendMagicLink, verifyMagicLink, loading, error } = useMagicLink();

// Hook for OTP
const { sendOtp, verifyOtp, loading, error } = useOtp();
``` 