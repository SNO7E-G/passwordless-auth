"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
exports.default = {
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000,
    jwt: {
        secret: process.env.JWT_SECRET || 'your-secret-key',
        expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    },
    db: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/passwordless-auth',
    },
    storage: {
        type: process.env.STORAGE_TYPE || 'memory', // 'memory', 'mongodb', 'postgres', etc.
        options: {
        // Additional options for specific storage types
        },
    },
    email: {
        host: process.env.EMAIL_HOST || 'smtp.example.com',
        port: parseInt(process.env.EMAIL_PORT || '587', 10),
        user: process.env.EMAIL_USER || 'user@example.com',
        pass: process.env.EMAIL_PASS || 'password',
        from: process.env.EMAIL_FROM || 'no-reply@example.com',
        provider: process.env.EMAIL_PROVIDER || 'smtp', // 'smtp', 'sendgrid', 'mailgun', etc.
    },
    sms: {
        provider: process.env.SMS_PROVIDER || 'twilio', // 'twilio', 'nexmo', 'aws-sns', etc.
        accountSid: process.env.TWILIO_ACCOUNT_SID || '',
        authToken: process.env.TWILIO_AUTH_TOKEN || '',
        phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
    },
    security: {
        tokenExpiryMinutes: parseInt(process.env.TOKEN_EXPIRY_MINUTES || '15', 10),
        magicLinkExpiryMinutes: parseInt(process.env.MAGIC_LINK_EXPIRY_MINUTES || '15', 10),
        otpExpiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10),
        otpLength: parseInt(process.env.OTP_LENGTH || '6', 10),
        otpAlgorithm: process.env.OTP_ALGORITHM || 'sha1', // 'sha1', 'sha256', 'sha512'
    },
    localization: {
        defaultLocale: process.env.DEFAULT_LOCALE || 'en',
        supportedLocales: process.env.SUPPORTED_LOCALES ?
            process.env.SUPPORTED_LOCALES.split(',') : ['en'],
    },
    baseUrl: process.env.BASE_URL || 'http://localhost:3000',
    corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000'],
};
//# sourceMappingURL=index.js.map