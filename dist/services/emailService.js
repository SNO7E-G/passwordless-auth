"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer_1 = __importDefault(require("nodemailer"));
const config_1 = __importDefault(require("../config"));
class EmailService {
    constructor() {
        this.transporter = nodemailer_1.default.createTransport({
            host: config_1.default.email.host,
            port: config_1.default.email.port,
            secure: config_1.default.email.port === 465,
            auth: {
                user: config_1.default.email.user,
                pass: config_1.default.email.pass,
            },
        });
    }
    /**
     * Send a magic link email
     * @param to Recipient email
     * @param link Magic link URL
     * @param templateVars Additional template variables
     */
    async sendMagicLink(to, link, templateVars) {
        const subject = 'Your Magic Link for Authentication';
        const text = `Here is your magic link to sign in: ${link}\nThis link will expire in ${config_1.default.security.magicLinkExpiryMinutes} minutes.`;
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Your Magic Link</h2>
        <p>Click the button below to sign in securely:</p>
        <a href="${link}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">Sign In</a>
        <p>Or copy and paste this URL into your browser:</p>
        <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 3px;">${link}</p>
        <p>This link will expire in ${config_1.default.security.magicLinkExpiryMinutes} minutes.</p>
        <p>If you didn't request this link, please ignore this email.</p>
      </div>
    `;
        return this.sendEmail(to, subject, text, html);
    }
    /**
     * Send an OTP email
     * @param to Recipient email
     * @param otp One-time password
     * @param templateVars Additional template variables
     */
    async sendOTP(to, otp, templateVars) {
        const subject = 'Your One-Time Password';
        const text = `Your verification code is: ${otp}\nThis code will expire in ${config_1.default.security.otpExpiryMinutes} minutes.`;
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Your Verification Code</h2>
        <p>Use the following code to complete your sign-in:</p>
        <div style="font-size: 24px; font-weight: bold; background-color: #f5f5f5; padding: 15px; letter-spacing: 5px; text-align: center; border-radius: 5px; margin: 20px 0;">${otp}</div>
        <p>This code will expire in ${config_1.default.security.otpExpiryMinutes} minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
      </div>
    `;
        return this.sendEmail(to, subject, text, html);
    }
    /**
     * Send a welcome email
     * @param to Recipient email
     * @param templateVars Additional template variables
     */
    async sendWelcome(to, templateVars) {
        const subject = 'Welcome to Passwordless Authentication';
        const text = `Welcome! Your account has been created successfully.`;
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome!</h2>
        <p>Your account has been created successfully.</p>
        <p>You can now sign in securely using magic links or one-time passwords.</p>
      </div>
    `;
        return this.sendEmail(to, subject, text, html);
    }
    /**
     * Generic method to send an email
     * @param to Recipient email
     * @param subject Email subject
     * @param text Plain text content
     * @param html HTML content
     */
    async sendEmail(to, subject, text, html) {
        try {
            const result = await this.transporter.sendMail({
                from: config_1.default.email.from,
                to,
                subject,
                text,
                html,
            });
            return true;
        }
        catch (error) {
            console.error('Error sending email:', error);
            return false;
        }
    }
    /**
     * Public method to send an email
     * @param to Recipient email
     * @param subject Email subject
     * @param text Plain text content
     * @param html HTML content
     */
    async sendMail(to, subject, text, html) {
        return this.sendEmail(to, subject, text, html);
    }
}
exports.default = new EmailService();
//# sourceMappingURL=emailService.js.map