"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const twilio_1 = __importDefault(require("twilio"));
const config_1 = __importDefault(require("../config"));
class SmsService {
    constructor() {
        this.client = null;
        if (config_1.default.sms.accountSid && config_1.default.sms.authToken) {
            this.client = (0, twilio_1.default)(config_1.default.sms.accountSid, config_1.default.sms.authToken);
        }
    }
    /**
     * Send an OTP via SMS
     * @param to Recipient phone number (in E.164 format)
     * @param otp One-time password
     * @returns Success status
     */
    async sendOTP(to, otp) {
        if (!this.client) {
            console.error('SMS client not configured. Check your Twilio credentials.');
            return false;
        }
        const message = `Your verification code is: ${otp}. This code will expire in ${config_1.default.security.otpExpiryMinutes} minutes.`;
        try {
            const result = await this.client.messages.create({
                body: message,
                from: config_1.default.sms.phoneNumber,
                to,
            });
            return true;
        }
        catch (error) {
            console.error('Error sending SMS:', error);
            return false;
        }
    }
    /**
     * Check if the SMS service is configured
     * @returns Whether SMS service is ready to use
     */
    isConfigured() {
        return this.client !== null;
    }
    /**
     * Send a message via SMS
     * @param to Recipient phone number (in E.164 format)
     * @param message Message content
     * @returns Success status
     */
    async sendMessage(to, message) {
        if (!this.client) {
            console.error('SMS client not configured. Check your Twilio credentials.');
            return false;
        }
        try {
            const result = await this.client.messages.create({
                body: message,
                from: config_1.default.sms.phoneNumber,
                to,
            });
            return true;
        }
        catch (error) {
            console.error('Error sending SMS:', error);
            return false;
        }
    }
}
exports.default = new SmsService();
//# sourceMappingURL=smsService.js.map