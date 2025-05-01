# Passwordless Authentication Library Documentation

Welcome to the documentation for the Passwordless Authentication Library. This documentation provides comprehensive information about the library, its features, and how to use it effectively.

## Table of Contents

- [API Reference](API.md) - Detailed reference for all services, methods, and interfaces
- [Integration Guide](INTEGRATIONS.md) - Instructions for integrating with various frameworks
- [Code Examples](CODE_EXAMPLES.md) - Examples of common usage patterns
- [Security Best Practices](SECURITY.md) - Guidelines for securing your authentication implementation
- [Contributing Guide](CONTRIBUTING.md) - Information for contributors

## Getting Started

The Passwordless Authentication Library provides a flexible and secure solution for implementing modern authentication methods without traditional passwords. It supports various authentication methods like magic links, one-time passwords, time-based one-time passwords, and WebAuthn.

### Installation

```bash
npm install passwordless-auth
```

### Basic Setup

```typescript
import { authService, emailService, storageService } from 'passwordless-auth';
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

### Quick Examples

#### Magic Link Authentication

```typescript
// Send a magic link
const result = await authService.sendMagicLink('user@example.com', {
  redirectUrl: 'https://your-app.com/auth/callback'
});

// Verify a magic link
const verification = await authService.verifyMagicLink(token);
if (verification.success) {
  // User is authenticated
  const { token, user } = verification;
}
```

#### Email OTP Authentication

```typescript
// Send an OTP via email
const result = await authService.sendEmailOTP('user@example.com');

// Verify the OTP
const verification = await authService.verifyOTP('user@example.com', undefined, '123456');
```

#### SMS OTP Authentication

```typescript
// Send an OTP via SMS
const result = await authService.sendSmsOTP('+1234567890');

// Verify the OTP
const verification = await authService.verifyOTP(undefined, '+1234567890', '123456');
```

## Features Overview

### Authentication Methods

- **Magic Link Authentication**: Send users secure login links via email
- **One-Time Password (OTP)**: Deliver OTPs via email or SMS
- **TOTP Authentication**: Support for Time-based One-Time Password apps
- **WebAuthn Support**: Enable biometric and hardware security key authentication

### Security Features

- **JWT Token Management**: Secure session handling with JWT
- **Multi-factor Authentication**: Combine different authentication methods
- **Rate Limiting**: Protection against brute-force attacks
- **Adaptive Authentication**: Risk-based authentication

### Integrations

- **Express Integration**: Easy to integrate with Express applications
- **React Integration**: Ready-to-use React components and hooks
- **Database Adapters**: Support for MongoDB and other databases

## Advanced Topics

For more detailed information, please refer to the specific documentation sections:

- **[API Reference](API.md)** for detailed method signatures and usage
- **[Integration Guide](INTEGRATIONS.md)** for framework-specific integration instructions
- **[Security Best Practices](SECURITY.md)** for securing your authentication system

## Support and Community

If you need help or have questions, you can:
- Open an issue on [GitHub](https://github.com/SNO7E-G/passwordless-auth/issues)
- Contribute to the project by following our [Contributing Guide](CONTRIBUTING.md)

---

<div align="center">
  <p>Copyright © 2024 Mahmoud Ashraf (SNO7E)</p>
  <p>Made with ❤️ for secure authentication</p>
</div> 