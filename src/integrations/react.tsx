import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../interfaces';

// Auth context type definitions
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, options?: any) => Promise<boolean>;
  loginWithPhone: (phone: string, options?: any) => Promise<boolean>;
  verifyOtp: (email: string | undefined, phone: string | undefined, otp: string) => Promise<boolean>;
  verifyMagicLink: (token: string) => Promise<boolean>;
  logout: () => Promise<void>;
  error: string | null;
}

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
  apiUrl?: string;
}

// Default context value
const defaultContext: AuthContextType = {
  user: null,
  isLoading: false,
  isAuthenticated: false,
  login: async () => false,
  loginWithPhone: async () => false,
  verifyOtp: async () => false,
  verifyMagicLink: async () => false,
  logout: async () => {},
  error: null,
};

// Create context
const AuthContext = createContext<AuthContextType>(defaultContext);

/**
 * Hook to use authentication
 * @returns Auth context
 */
export const useAuth = () => {
  return useContext(AuthContext);
};

/**
 * Authentication provider component
 * @param props Provider props
 * @returns Provider component
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ 
  children, 
  apiUrl = 'http://localhost:3000/auth' 
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Check if token exists in storage
  useEffect(() => {
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
        } else {
          // Clear invalid token
          localStorage.removeItem('authToken');
          setUser(null);
        }
      } catch (err) {
        console.error('Authentication error:', err);
        setError('Failed to authenticate. Please try again.');
        // Clear potentially invalid token
        localStorage.removeItem('authToken');
        setUser(null);
      } finally {
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
  const login = async (email: string, options?: { useMagicLink?: boolean }): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const endpoint = options?.useMagicLink !== false ? 'magic-link' : 'email-otp';
      
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
      } else {
        setError(data.message || 'Failed to login. Please try again.');
        return false;
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred during login. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Login with phone (SMS OTP)
   * @param phone User phone number
   * @param options Additional options
   * @returns Success status
   */
  const loginWithPhone = async (phone: string, options?: any): Promise<boolean> => {
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
      } else {
        setError(data.message || 'Failed to send OTP. Please try again.');
        return false;
      }
    } catch (err) {
      console.error('SMS OTP error:', err);
      setError('An error occurred sending the OTP. Please try again.');
      return false;
    } finally {
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
  const verifyOtp = async (
    email: string | undefined, 
    phone: string | undefined, 
    otp: string
  ): Promise<boolean> => {
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
      } else {
        setError(data.message || 'Invalid verification code. Please try again.');
        return false;
      }
    } catch (err) {
      console.error('OTP verification error:', err);
      setError('An error occurred during verification. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Verify magic link token
   * @param token Magic link token
   * @returns Success status
   */
  const verifyMagicLink = async (token: string): Promise<boolean> => {
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
      } else {
        setError(data.message || 'Invalid or expired link. Please try again.');
        return false;
      }
    } catch (err) {
      console.error('Magic link verification error:', err);
      setError('An error occurred during verification. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Logout user
   */
  const logout = async (): Promise<void> => {
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
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Always clear local token and user state
      localStorage.removeItem('authToken');
      setUser(null);
      setIsLoading(false);
    }
  };
  
  const value: AuthContextType = {
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
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Auth components
 */

interface LoginFormProps {
  onSuccess?: () => void;
  useMagicLink?: boolean;
}

export const EmailLoginForm: React.FC<LoginFormProps> = ({ 
  onSuccess, 
  useMagicLink = true 
}) => {
  const { login, isLoading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) return;
    
    const success = await login(email, { useMagicLink });
    
    if (success) {
      setShowConfirmation(true);
      if (onSuccess) onSuccess();
    }
  };
  
  if (showConfirmation) {
    return (
      <div className="auth-confirmation">
        <h3>Check your email</h3>
        <p>
          We've sent a {useMagicLink ? 'magic link' : 'verification code'} to {email}.
          {useMagicLink 
            ? ' Click the link to sign in.' 
            : ' Enter the code to complete your sign in.'}
        </p>
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
        />
      </div>
      
      {error && <div className="auth-error">{error}</div>}
      
      <button type="submit" disabled={isLoading} className="auth-button">
        {isLoading ? 'Sending...' : useMagicLink ? 'Send Magic Link' : 'Send Verification Code'}
      </button>
    </form>
  );
};

interface OtpVerificationFormProps {
  email?: string;
  phone?: string;
  onSuccess?: () => void;
}

export const OtpVerificationForm: React.FC<OtpVerificationFormProps> = ({ 
  email, 
  phone, 
  onSuccess 
}) => {
  const { verifyOtp, isLoading, error } = useAuth();
  const [otp, setOtp] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp) return;
    
    const success = await verifyOtp(email, phone, otp);
    
    if (success && onSuccess) {
      onSuccess();
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <div className="form-group">
        <label htmlFor="otp">Verification Code</label>
        <input
          type="text"
          id="otp"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="Enter verification code"
          required
        />
      </div>
      
      {error && <div className="auth-error">{error}</div>}
      
      <button type="submit" disabled={isLoading} className="auth-button">
        {isLoading ? 'Verifying...' : 'Verify'}
      </button>
    </form>
  );
};

export const MagicLinkVerification: React.FC<{ 
  token: string;
  onSuccess?: () => void;
  onError?: () => void;
}> = ({ token, onSuccess, onError }) => {
  const { verifyMagicLink, isLoading, error } = useAuth();
  const [isVerifying, setIsVerifying] = useState(true);
  
  useEffect(() => {
    const verifyToken = async () => {
      const success = await verifyMagicLink(token);
      
      setIsVerifying(false);
      
      if (success && onSuccess) {
        onSuccess();
      } else if (!success && onError) {
        onError();
      }
    };
    
    if (token) {
      verifyToken();
    } else {
      setIsVerifying(false);
      if (onError) onError();
    }
  }, [token, verifyMagicLink, onSuccess, onError]);
  
  if (isVerifying || isLoading) {
    return <div className="auth-loading">Verifying your login...</div>;
  }
  
  if (error) {
    return <div className="auth-error">{error}</div>;
  }
  
  return null;
};

export const LogoutButton: React.FC<{
  onLogout?: () => void;
  className?: string;
  children?: ReactNode;
}> = ({ onLogout, className = 'auth-logout-button', children }) => {
  const { logout, isLoading } = useAuth();
  
  const handleLogout = async () => {
    await logout();
    if (onLogout) onLogout();
  };
  
  return (
    <button 
      onClick={handleLogout} 
      disabled={isLoading} 
      className={className}
    >
      {children || 'Sign Out'}
    </button>
  );
};

/**
 * Protected route component
 */
export const ProtectedRoute: React.FC<{
  children: ReactNode;
  fallback?: ReactNode;
  roles?: string[];
}> = ({ children, fallback, roles }) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  
  // Check if still loading
  if (isLoading) {
    return <div className="auth-loading">Loading...</div>;
  }
  
  // Check if not authenticated
  if (!isAuthenticated) {
    return fallback ? <>{fallback}</> : <div className="auth-unauthorized">Please sign in to access this page</div>;
  }
  
  // Check roles if specified
  if (roles && roles.length > 0) {
    const hasRequiredRole = roles.some(role => 
      user?.roles?.includes(role)
    );
    
    if (!hasRequiredRole) {
      return <div className="auth-unauthorized">You don't have permission to access this page</div>;
    }
  }
  
  // All checks passed, render children
  return <>{children}</>;
}; 