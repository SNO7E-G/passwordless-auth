"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProtectedRoute = exports.LogoutButton = exports.MagicLinkVerification = exports.OtpVerificationForm = exports.EmailLoginForm = exports.AuthProvider = exports.useAuth = void 0;
const react_1 = __importStar(require("react"));
// Default context value
const defaultContext = {
    user: null,
    isLoading: false,
    isAuthenticated: false,
    login: async () => false,
    loginWithPhone: async () => false,
    verifyOtp: async () => false,
    verifyMagicLink: async () => false,
    logout: async () => { },
    error: null,
};
// Create context
const AuthContext = (0, react_1.createContext)(defaultContext);
/**
 * Hook to use authentication
 * @returns Auth context
 */
const useAuth = () => {
    return (0, react_1.useContext)(AuthContext);
};
exports.useAuth = useAuth;
/**
 * Authentication provider component
 * @param props Provider props
 * @returns Provider component
 */
const AuthProvider = ({ children, apiUrl = 'http://localhost:3000/auth' }) => {
    const [user, setUser] = (0, react_1.useState)(null);
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    // Check if token exists in storage
    (0, react_1.useEffect)(() => {
        const checkAuth = async () => {
            setIsLoading(true);
            try {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    setUser(null);
                    setIsLoading(false);
                    return;
                }
                // Validate token with server
                const response = await fetch(`${apiUrl}/validate-token`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });
                const data = await response.json();
                if (data.success) {
                    setUser(data.user);
                }
                else {
                    // Clear invalid token
                    localStorage.removeItem('authToken');
                    setUser(null);
                }
            }
            catch (err) {
                console.error('Authentication error:', err);
                setError('Failed to authenticate. Please try again.');
                // Clear potentially invalid token
                localStorage.removeItem('authToken');
                setUser(null);
            }
            finally {
                setIsLoading(false);
            }
        };
        checkAuth();
    }, [apiUrl]);
    /**
     * Login with email (magic link or OTP)
     * @param email User email
     * @param options Additional options
     * @returns Success status
     */
    const login = async (email, options) => {
        setIsLoading(true);
        setError(null);
        try {
            const endpoint = (options === null || options === void 0 ? void 0 : options.useMagicLink) !== false ? 'magic-link' : 'email-otp';
            const response = await fetch(`${apiUrl}/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });
            const data = await response.json();
            if (data.success) {
                return true;
            }
            else {
                setError(data.message || 'Failed to login. Please try again.');
                return false;
            }
        }
        catch (err) {
            console.error('Login error:', err);
            setError('An error occurred during login. Please try again.');
            return false;
        }
        finally {
            setIsLoading(false);
        }
    };
    /**
     * Login with phone (SMS OTP)
     * @param phone User phone number
     * @param options Additional options
     * @returns Success status
     */
    const loginWithPhone = async (phone, options) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${apiUrl}/sms-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ phone }),
            });
            const data = await response.json();
            if (data.success) {
                return true;
            }
            else {
                setError(data.message || 'Failed to send OTP. Please try again.');
                return false;
            }
        }
        catch (err) {
            console.error('SMS OTP error:', err);
            setError('An error occurred sending the OTP. Please try again.');
            return false;
        }
        finally {
            setIsLoading(false);
        }
    };
    /**
     * Verify OTP (email or SMS)
     * @param email User email (optional)
     * @param phone User phone (optional)
     * @param otp OTP code
     * @returns Success status
     */
    const verifyOtp = async (email, phone, otp) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${apiUrl}/verify-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, phone, otp }),
            });
            const data = await response.json();
            if (data.success) {
                // Save token and set user
                localStorage.setItem('authToken', data.token);
                setUser(data.user);
                return true;
            }
            else {
                setError(data.message || 'Invalid verification code. Please try again.');
                return false;
            }
        }
        catch (err) {
            console.error('OTP verification error:', err);
            setError('An error occurred during verification. Please try again.');
            return false;
        }
        finally {
            setIsLoading(false);
        }
    };
    /**
     * Verify magic link token
     * @param token Magic link token
     * @returns Success status
     */
    const verifyMagicLink = async (token) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${apiUrl}/verify-magic-link`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token }),
            });
            const data = await response.json();
            if (data.success) {
                // Save token and set user
                localStorage.setItem('authToken', data.token);
                setUser(data.user);
                return true;
            }
            else {
                setError(data.message || 'Invalid or expired link. Please try again.');
                return false;
            }
        }
        catch (err) {
            console.error('Magic link verification error:', err);
            setError('An error occurred during verification. Please try again.');
            return false;
        }
        finally {
            setIsLoading(false);
        }
    };
    /**
     * Logout user
     */
    const logout = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            if (token) {
                await fetch(`${apiUrl}/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });
            }
        }
        catch (err) {
            console.error('Logout error:', err);
        }
        finally {
            // Always clear local token and user state
            localStorage.removeItem('authToken');
            setUser(null);
            setIsLoading(false);
        }
    };
    const value = {
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        loginWithPhone,
        verifyOtp,
        verifyMagicLink,
        logout,
        error,
    };
    return (react_1.default.createElement(AuthContext.Provider, { value: value }, children));
};
exports.AuthProvider = AuthProvider;
const EmailLoginForm = ({ onSuccess, useMagicLink = true }) => {
    const { login, isLoading, error } = (0, exports.useAuth)();
    const [email, setEmail] = (0, react_1.useState)('');
    const [showConfirmation, setShowConfirmation] = (0, react_1.useState)(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email)
            return;
        const success = await login(email, { useMagicLink });
        if (success) {
            setShowConfirmation(true);
            if (onSuccess)
                onSuccess();
        }
    };
    if (showConfirmation) {
        return (react_1.default.createElement("div", { className: "auth-confirmation" },
            react_1.default.createElement("h3", null, "Check your email"),
            react_1.default.createElement("p", null,
                "We've sent a ",
                useMagicLink ? 'magic link' : 'verification code',
                " to ",
                email,
                ".",
                useMagicLink
                    ? ' Click the link to sign in.'
                    : ' Enter the code to complete your sign in.')));
    }
    return (react_1.default.createElement("form", { onSubmit: handleSubmit, className: "auth-form" },
        react_1.default.createElement("div", { className: "form-group" },
            react_1.default.createElement("label", { htmlFor: "email" }, "Email"),
            react_1.default.createElement("input", { type: "email", id: "email", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "your@email.com", required: true })),
        error && react_1.default.createElement("div", { className: "auth-error" }, error),
        react_1.default.createElement("button", { type: "submit", disabled: isLoading, className: "auth-button" }, isLoading ? 'Sending...' : useMagicLink ? 'Send Magic Link' : 'Send Verification Code')));
};
exports.EmailLoginForm = EmailLoginForm;
const OtpVerificationForm = ({ email, phone, onSuccess }) => {
    const { verifyOtp, isLoading, error } = (0, exports.useAuth)();
    const [otp, setOtp] = (0, react_1.useState)('');
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!otp)
            return;
        const success = await verifyOtp(email, phone, otp);
        if (success && onSuccess) {
            onSuccess();
        }
    };
    return (react_1.default.createElement("form", { onSubmit: handleSubmit, className: "auth-form" },
        react_1.default.createElement("div", { className: "form-group" },
            react_1.default.createElement("label", { htmlFor: "otp" }, "Verification Code"),
            react_1.default.createElement("input", { type: "text", id: "otp", value: otp, onChange: (e) => setOtp(e.target.value), placeholder: "Enter verification code", required: true })),
        error && react_1.default.createElement("div", { className: "auth-error" }, error),
        react_1.default.createElement("button", { type: "submit", disabled: isLoading, className: "auth-button" }, isLoading ? 'Verifying...' : 'Verify')));
};
exports.OtpVerificationForm = OtpVerificationForm;
const MagicLinkVerification = ({ token, onSuccess, onError }) => {
    const { verifyMagicLink, isLoading, error } = (0, exports.useAuth)();
    const [isVerifying, setIsVerifying] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        const verifyToken = async () => {
            const success = await verifyMagicLink(token);
            setIsVerifying(false);
            if (success && onSuccess) {
                onSuccess();
            }
            else if (!success && onError) {
                onError();
            }
        };
        if (token) {
            verifyToken();
        }
        else {
            setIsVerifying(false);
            if (onError)
                onError();
        }
    }, [token, verifyMagicLink, onSuccess, onError]);
    if (isVerifying || isLoading) {
        return react_1.default.createElement("div", { className: "auth-loading" }, "Verifying your login...");
    }
    if (error) {
        return react_1.default.createElement("div", { className: "auth-error" }, error);
    }
    return null;
};
exports.MagicLinkVerification = MagicLinkVerification;
const LogoutButton = ({ onLogout, className = 'auth-logout-button', children }) => {
    const { logout, isLoading } = (0, exports.useAuth)();
    const handleLogout = async () => {
        await logout();
        if (onLogout)
            onLogout();
    };
    return (react_1.default.createElement("button", { onClick: handleLogout, disabled: isLoading, className: className }, children || 'Sign Out'));
};
exports.LogoutButton = LogoutButton;
/**
 * Protected route component
 */
const ProtectedRoute = ({ children, fallback, roles }) => {
    const { user, isLoading, isAuthenticated } = (0, exports.useAuth)();
    // Check if still loading
    if (isLoading) {
        return react_1.default.createElement("div", { className: "auth-loading" }, "Loading...");
    }
    // Check if not authenticated
    if (!isAuthenticated) {
        return fallback ? react_1.default.createElement(react_1.default.Fragment, null, fallback) : react_1.default.createElement("div", { className: "auth-unauthorized" }, "Please sign in to access this page");
    }
    // Check roles if specified
    if (roles && roles.length > 0) {
        const hasRequiredRole = roles.some(role => { var _a; return (_a = user === null || user === void 0 ? void 0 : user.roles) === null || _a === void 0 ? void 0 : _a.includes(role); });
        if (!hasRequiredRole) {
            return react_1.default.createElement("div", { className: "auth-unauthorized" }, "You don't have permission to access this page");
        }
    }
    // All checks passed, render children
    return react_1.default.createElement(react_1.default.Fragment, null, children);
};
exports.ProtectedRoute = ProtectedRoute;
//# sourceMappingURL=react.js.map