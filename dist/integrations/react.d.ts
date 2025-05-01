import React, { ReactNode } from 'react';
interface AuthProviderProps {
    children: ReactNode;
    apiUrl?: string;
}
/**
 * Hook to use authentication
 * @returns Auth context
 */
export declare const useAuth: () => any;
/**
 * Authentication provider component
 * @param props Provider props
 * @returns Provider component
 */
export declare const AuthProvider: React.FC<AuthProviderProps>;
/**
 * Auth components
 */
interface LoginFormProps {
    onSuccess?: () => void;
    useMagicLink?: boolean;
}
export declare const EmailLoginForm: React.FC<LoginFormProps>;
interface OtpVerificationFormProps {
    email?: string;
    phone?: string;
    onSuccess?: () => void;
}
export declare const OtpVerificationForm: React.FC<OtpVerificationFormProps>;
export declare const MagicLinkVerification: React.FC<{
    token: string;
    onSuccess?: () => void;
    onError?: () => void;
}>;
export declare const LogoutButton: React.FC<{
    onLogout?: () => void;
    className?: string;
    children?: ReactNode;
}>;
/**
 * Protected route component
 */
export declare const ProtectedRoute: React.FC<{
    children: ReactNode;
    fallback?: ReactNode;
    roles?: string[];
}>;
export {};
