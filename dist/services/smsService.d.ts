declare class SmsService {
    private client;
    constructor();
    /**
     * Send an OTP via SMS
     * @param to Recipient phone number (in E.164 format)
     * @param otp One-time password
     * @returns Success status
     */
    sendOTP(to: string, otp: string): Promise<boolean>;
    /**
     * Check if the SMS service is configured
     * @returns Whether SMS service is ready to use
     */
    isConfigured(): boolean;
    /**
     * Send a message via SMS
     * @param to Recipient phone number (in E.164 format)
     * @param message Message content
     * @returns Success status
     */
    sendMessage(to: string, message: string): Promise<boolean>;
}
declare const _default: SmsService;
export default _default;
