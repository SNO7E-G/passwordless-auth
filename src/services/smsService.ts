import twilio from 'twilio';
import config from '../config';

class SmsService {
  private client: twilio.Twilio | null = null;
  
  constructor() {
    if (config.sms.accountSid && config.sms.authToken) {
      this.client = twilio(config.sms.accountSid, config.sms.authToken);
    }
  }
  
  /**
   * Send an OTP via SMS
   * @param to Recipient phone number (in E.164 format)
   * @param otp One-time password
   * @returns Success status
   */
  async sendOTP(to: string, otp: string): Promise<boolean> {
    if (!this.client) {
      console.error('SMS client not configured. Check your Twilio credentials.');
      return false;
    }
    
    const message = `Your verification code is: ${otp}. This code will expire in ${config.security.otpExpiryMinutes} minutes.`;
    
    try {
      const result = await this.client.messages.create({
        body: message,
        from: config.sms.phoneNumber,
        to,
      });
      
      return true;
    } catch (error) {
      console.error('Error sending SMS:', error);
      return false;
    }
  }
  
  /**
   * Check if the SMS service is configured
   * @returns Whether SMS service is ready to use
   */
  isConfigured(): boolean {
    return this.client !== null;
  }

  /**
   * Send a message via SMS
   * @param to Recipient phone number (in E.164 format) 
   * @param message Message content
   * @returns Success status
   */
  async sendMessage(to: string, message: string): Promise<boolean> {
    if (!this.client) {
      console.error('SMS client not configured. Check your Twilio credentials.');
      return false;
    }
    
    try {
      const result = await this.client.messages.create({
        body: message,
        from: config.sms.phoneNumber,
        to,
      });
      
      return true;
    } catch (error) {
      console.error('Error sending SMS:', error);
      return false;
    }
  }
}

export default new SmsService(); 