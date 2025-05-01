export interface User {
  id: string;
  email?: string;
  phone?: string;
  displayName?: string;
  verified: boolean;
  roles?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthToken {
  id: string;
  userId: string;
  token: string;
  type: TokenType;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt: Date;
}

export enum TokenType {
  MAGIC_LINK = 'magic_link',
  OTP_EMAIL = 'otp_email',
  OTP_SMS = 'otp_sms',
  WEBAUTHN = 'webauthn',
  TOTP = 'totp',
}

export interface MagicLinkOptions {
  expiresIn?: number; // minutes
  redirectUrl?: string;
  templateId?: string;
  templateVars?: Record<string, any>;
}

export interface OtpOptions {
  expiresIn?: number; // minutes
  length?: number;
  templateId?: string;
  templateVars?: Record<string, any>;
}

export interface LoginOptions {
  magicLink?: MagicLinkOptions;
  otp?: OtpOptions;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  expiresAt?: Date;
  user?: User;
}

export interface VerificationResult {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
  expiresAt?: Date;
}

export interface TotpSetupResponse {
  secret: string;
  qrCodeUrl: string;
}

export interface WebAuthnRegistrationOptions {
  challenge: string;
  rp: {
    name: string;
    id: string;
  };
  user: {
    id: string;
    name: string;
    displayName: string;
  };
  pubKeyCredParams: {
    type: string;
    alg: number;
  }[];
  timeout: number;
  attestation: string;
  excludeCredentials: {
    id: string;
    type: string;
    transports?: string[];
  }[];
  authenticatorSelection?: {
    authenticatorAttachment?: string;
    requireResidentKey?: boolean;
    userVerification?: string;
  };
}

export interface WebAuthnRegistrationResult {
  id: string;
  rawId: string;
  response: {
    attestationObject: string;
    clientDataJSON: string;
  };
  type: string;
}

export interface WebAuthnCredential {
  id: string;
  userId: string;
  publicKey: string;
  counter: number;
  deviceName?: string;
  createdAt: Date;
  lastUsedAt: Date;
}

export interface LogEntry {
  id: string;
  userId?: string;
  action: string;
  status: 'success' | 'failure';
  details?: string;
  ip?: string;
  userAgent?: string;
  timestamp: Date;
} 