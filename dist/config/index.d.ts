declare const _default: {
    env: string;
    port: string | number;
    jwt: {
        secret: string;
        expiresIn: string;
    };
    db: {
        uri: string;
    };
    storage: {
        type: string;
        options: {};
    };
    email: {
        host: string;
        port: number;
        user: string;
        pass: string;
        from: string;
        provider: string;
    };
    sms: {
        provider: string;
        accountSid: string;
        authToken: string;
        phoneNumber: string;
    };
    security: {
        tokenExpiryMinutes: number;
        magicLinkExpiryMinutes: number;
        otpExpiryMinutes: number;
        otpLength: number;
        otpAlgorithm: string;
    };
    localization: {
        defaultLocale: string;
        supportedLocales: string[];
    };
    baseUrl: string;
    corsOrigins: string[];
};
export default _default;
