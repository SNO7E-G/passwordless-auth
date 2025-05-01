declare class EmailService {
    private transporter;
    constructor();
    /**
     * Send a magic link email
     * @param to Recipient email
     * @param link Magic link URL
     * @param templateVars Additional template variables
     */
    sendMagicLink(to: string, link: string, templateVars?: Record<string, any>): Promise<boolean>;
    /**
     * Send an OTP email
     * @param to Recipient email
     * @param otp One-time password
     * @param templateVars Additional template variables
     */
    sendOTP(to: string, otp: string, templateVars?: Record<string, any>): Promise<boolean>;
    /**
     * Send a welcome email
     * @param to Recipient email
     * @param templateVars Additional template variables
     */
    sendWelcome(to: string, templateVars?: Record<string, any>): Promise<boolean>;
    /**
     * Generic method to send an email
     * @param to Recipient email
     * @param subject Email subject
     * @param text Plain text content
     * @param html HTML content
     */
    private sendEmail;
    /**
     * Public method to send an email
     * @param to Recipient email
     * @param subject Email subject
     * @param text Plain text content
     * @param html HTML content
     */
    sendMail(to: string, subject: string, text: string, html: string): Promise<boolean>;
}
declare const _default: EmailService;
export default _default;
