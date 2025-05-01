interface I18nOptions {
    locale?: string;
    fallbackLocale?: string;
}
declare class I18nService {
    private locales;
    private defaultLocale;
    private supportedLocales;
    constructor();
    /**
     * Load locale data
     * @param locale Locale code to load
     */
    private loadLocale;
    /**
     * Get a translated message
     * @param key Message key
     * @param options Options including locale
     * @returns Translated message or key if not found
     */
    t(key: string, options?: I18nOptions): string;
    /**
     * Get an email template
     * @param templateName Template name
     * @param options Options including locale
     * @returns Template string or empty string if not found
     */
    getTemplate(templateName: string, options?: I18nOptions): string;
    /**
     * Render a template with variables
     * @param template Template string
     * @param variables Variables to replace in template
     * @returns Rendered template
     */
    renderTemplate(template: string, variables: Record<string, any>): string;
    /**
     * Get all supported locales
     * @returns Array of supported locale codes
     */
    getSupportedLocales(): string[];
    /**
     * Check if a locale is supported
     * @param locale Locale code to check
     * @returns True if supported
     */
    isLocaleSupported(locale: string): boolean;
}
declare const _default: I18nService;
export default _default;
