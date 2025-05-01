import fs from 'fs';
import path from 'path';
import config from '../config';

interface TranslationMessages {
  [key: string]: string;
}

interface LocaleData {
  messages: TranslationMessages;
  templates: {
    [key: string]: string;
  };
}

interface I18nOptions {
  locale?: string;
  fallbackLocale?: string;
}

class I18nService {
  private locales: Map<string, LocaleData> = new Map();
  private defaultLocale: string;
  private supportedLocales: string[];
  
  constructor() {
    this.defaultLocale = config.localization.defaultLocale;
    this.supportedLocales = config.localization.supportedLocales;
    
    // Load all supported locales
    this.supportedLocales.forEach(locale => {
      this.loadLocale(locale);
    });
  }
  
  /**
   * Load locale data
   * @param locale Locale code to load
   */
  private loadLocale(locale: string): void {
    try {
      // In a real implementation, we would load from files
      // For now, initialize with hard-coded values
      let messages: TranslationMessages = {};
      let templates: {[key: string]: string} = {};
      
      if (locale === 'en') {
        messages = {
          'auth.magicLink.subject': 'Your Login Link',
          'auth.magicLink.body': 'Click the link below to sign in:',
          'auth.otp.subject': 'Your Verification Code',
          'auth.otp.body': 'Your verification code is:',
          'auth.success': 'Authentication successful',
          'auth.failure': 'Authentication failed',
          'auth.expired': 'Authentication token expired',
          'auth.invalid': 'Invalid authentication token',
          'auth.notFound': 'User not found',
          'auth.alreadyExists': 'User already exists',
          'auth.missingField': 'Required field missing',
          'webauthn.registerStart': 'Begin registering your security device',
          'webauthn.registerComplete': 'Security device registered successfully',
          'webauthn.authStart': 'Begin authentication with your security device',
          'webauthn.authComplete': 'Security device authentication successful',
          'totp.setupSuccess': 'Two-factor authentication set up successfully',
          'totp.verifySuccess': 'Two-factor authentication verified successfully',
          'totp.verifyFailure': 'Invalid two-factor authentication code'
        };
        
        // Email templates
        templates = {
          'magicLink': `
            <html>
              <body>
                <h1>Login to Your Account</h1>
                <p>Hello,</p>
                <p>Click the link below to sign in to your account. This link will expire in {{expiryMinutes}} minutes.</p>
                <p><a href="{{link}}">Sign in to your account</a></p>
                <p>If you didn't request this link, you can safely ignore this email.</p>
              </body>
            </html>
          `,
          'emailOtp': `
            <html>
              <body>
                <h1>Your Verification Code</h1>
                <p>Hello,</p>
                <p>Your verification code is: <strong>{{otp}}</strong></p>
                <p>This code will expire in {{expiryMinutes}} minutes.</p>
                <p>If you didn't request this code, you can safely ignore this email.</p>
              </body>
            </html>
          `
        };
      } else if (locale === 'es') {
        messages = {
          'auth.magicLink.subject': 'Tu Enlace de Acceso',
          'auth.magicLink.body': 'Haz clic en el enlace a continuación para iniciar sesión:',
          'auth.otp.subject': 'Tu Código de Verificación',
          'auth.otp.body': 'Tu código de verificación es:',
          'auth.success': 'Autenticación exitosa',
          'auth.failure': 'Autenticación fallida',
          'auth.expired': 'Token de autenticación expirado',
          'auth.invalid': 'Token de autenticación inválido',
          'auth.notFound': 'Usuario no encontrado',
          'auth.alreadyExists': 'El usuario ya existe',
          'auth.missingField': 'Campo requerido faltante',
          'webauthn.registerStart': 'Comienza a registrar tu dispositivo de seguridad',
          'webauthn.registerComplete': 'Dispositivo de seguridad registrado con éxito',
          'webauthn.authStart': 'Comienza la autenticación con tu dispositivo de seguridad',
          'webauthn.authComplete': 'Autenticación con dispositivo de seguridad exitosa',
          'totp.setupSuccess': 'Autenticación de dos factores configurada con éxito',
          'totp.verifySuccess': 'Autenticación de dos factores verificada con éxito',
          'totp.verifyFailure': 'Código de autenticación de dos factores inválido'
        };
        
        // Email templates in Spanish
        templates = {
          'magicLink': `
            <html>
              <body>
                <h1>Inicia Sesión en tu Cuenta</h1>
                <p>Hola,</p>
                <p>Haz clic en el enlace a continuación para iniciar sesión en tu cuenta. Este enlace expirará en {{expiryMinutes}} minutos.</p>
                <p><a href="{{link}}">Iniciar sesión en tu cuenta</a></p>
                <p>Si no solicitaste este enlace, puedes ignorar este correo electrónico de forma segura.</p>
              </body>
            </html>
          `,
          'emailOtp': `
            <html>
              <body>
                <h1>Tu Código de Verificación</h1>
                <p>Hola,</p>
                <p>Tu código de verificación es: <strong>{{otp}}</strong></p>
                <p>Este código expirará en {{expiryMinutes}} minutos.</p>
                <p>Si no solicitaste este código, puedes ignorar este correo electrónico de forma segura.</p>
              </body>
            </html>
          `
        };
      }
      
      this.locales.set(locale, { messages, templates });
    } catch (error) {
      console.error(`Failed to load locale: ${locale}`, error);
    }
  }
  
  /**
   * Get a translated message
   * @param key Message key
   * @param options Options including locale
   * @returns Translated message or key if not found
   */
  t(key: string, options: I18nOptions = {}): string {
    const locale = options.locale || this.defaultLocale;
    const fallback = options.fallbackLocale || this.defaultLocale;
    
    // Try to get message in requested locale
    const localeData = this.locales.get(locale);
    if (localeData && localeData.messages[key]) {
      return localeData.messages[key];
    }
    
    // Try fallback locale
    const fallbackData = this.locales.get(fallback);
    if (fallbackData && fallbackData.messages[key]) {
      return fallbackData.messages[key];
    }
    
    // If not found, return the key
    return key;
  }
  
  /**
   * Get an email template
   * @param templateName Template name
   * @param options Options including locale
   * @returns Template string or empty string if not found
   */
  getTemplate(templateName: string, options: I18nOptions = {}): string {
    const locale = options.locale || this.defaultLocale;
    const fallback = options.fallbackLocale || this.defaultLocale;
    
    // Try to get template in requested locale
    const localeData = this.locales.get(locale);
    if (localeData && localeData.templates[templateName]) {
      return localeData.templates[templateName];
    }
    
    // Try fallback locale
    const fallbackData = this.locales.get(fallback);
    if (fallbackData && fallbackData.templates[templateName]) {
      return fallbackData.templates[templateName];
    }
    
    return '';
  }
  
  /**
   * Render a template with variables
   * @param template Template string
   * @param variables Variables to replace in template
   * @returns Rendered template
   */
  renderTemplate(template: string, variables: Record<string, any>): string {
    let rendered = template;
    
    // Replace variables in template
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, variables[key]);
    });
    
    return rendered;
  }
  
  /**
   * Get all supported locales
   * @returns Array of supported locale codes
   */
  getSupportedLocales(): string[] {
    return [...this.supportedLocales];
  }
  
  /**
   * Check if a locale is supported
   * @param locale Locale code to check
   * @returns True if supported
   */
  isLocaleSupported(locale: string): boolean {
    return this.supportedLocales.includes(locale);
  }
}

export default new I18nService(); 