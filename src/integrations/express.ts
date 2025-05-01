import express, { Router, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import authService from '../services/authService';
import { User } from '../interfaces';

/**
 * Auth middleware interface options
 */
interface AuthMiddlewareOptions {
  required?: boolean;
  roles?: string[];
}

/**
 * Extended Express Request with user
 */
export interface AuthRequest extends Request {
  user?: User;
}

/**
 * Create Express middleware for authentication
 * @param options Authentication options
 * @returns Express middleware function
 */
export function authMiddleware(options: AuthMiddlewareOptions = {}) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      if (options.required) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.'
        });
      } else {
        // If auth is optional, continue without user object
        return next();
      }
    }
    
    const token = authHeader.split(' ')[1];
    const user = authService.validateToken(token);
    
    if (!user) {
      if (options.required) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired token.'
        });
      } else {
        // If auth is optional, continue without user object
        return next();
      }
    }
    
    // Check roles if specified
    if (options.roles && options.roles.length > 0) {
      // In a real implementation, check user roles
      // For now, we'll just check if the property exists
      const hasRole = options.roles.some(role => 
        user.roles && user.roles.includes(role)
      );
      
      if (!hasRole) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions.'
        });
      }
    }
    
    // Attach user to request
    req.user = user;
    next();
  };
}

/**
 * Configure Express router with authentication endpoints
 * @param options Configuration options
 * @returns Configured Express router
 */
export function createAuthRouter(options: {
  loginRedirectUrl?: string;
  apiPrefix?: string;
  rateLimitMax?: number;
  rateLimitWindowMs?: number;
} = {}) {
  const router = Router();
  
  // Set up rate limiter
  const authLimiter = rateLimit({
    windowMs: options.rateLimitWindowMs || 15 * 60 * 1000, // 15 minutes
    max: options.rateLimitMax || 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many authentication attempts, please try again later.',
  });
  
  router.use(authLimiter);
  
  // Magic Link Authentication
  router.post('/magic-link', async (req: Request, res: Response) => {
    const { email, redirectUrl } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required.',
      });
    }
    
    const options = redirectUrl ? { redirectUrl } : undefined;
    const result = await authService.sendMagicLink(email, options);
    
    res.status(result.success ? 200 : 500).json(result);
  });
  
  // Email OTP Authentication
  router.post('/email-otp', async (req: Request, res: Response) => {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required.',
      });
    }
    
    const result = await authService.sendEmailOTP(email);
    
    res.status(result.success ? 200 : 500).json(result);
  });
  
  // SMS OTP Authentication
  router.post('/sms-otp', async (req: Request, res: Response) => {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required.',
      });
    }
    
    const result = await authService.sendSmsOTP(phone);
    
    res.status(result.success ? 200 : 500).json(result);
  });
  
  // Verify Magic Link
  router.post('/verify-magic-link', async (req: Request, res: Response) => {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required.',
      });
    }
    
    const result = await authService.verifyMagicLink(token as string);
    
    res.status(result.success ? 200 : 400).json(result);
  });
  
  // Verify OTP
  router.post('/verify-otp', async (req: Request, res: Response) => {
    const { email, phone, otp } = req.body;
    
    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'OTP is required.',
      });
    }
    
    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: 'Either email or phone is required.',
      });
    }
    
    const result = await authService.verifyOTP(email, phone, otp);
    
    res.status(result.success ? 200 : 400).json(result);
  });
  
  // Validate Token
  router.post('/validate-token', authMiddleware({ required: true }), (req: AuthRequest, res: Response) => {
    res.status(200).json({
      success: true,
      message: 'Token is valid.',
      user: req.user,
    });
  });
  
  // Logout
  router.post('/logout', authMiddleware({ required: true }), async (req: AuthRequest, res: Response) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1] || '';
    
    const success = await authService.logout(token);
    
    res.status(success ? 200 : 400).json({
      success,
      message: success ? 'Successfully logged out.' : 'Failed to logout.',
    });
  });
  
  return router;
}

/**
 * Configure Express app with authentication routes
 * @param app Express application
 * @param options Configuration options
 */
export function configureAuth(app: express.Application, options: {
  loginRedirectUrl?: string;
  apiPrefix?: string;
  rateLimitMax?: number;
  rateLimitWindowMs?: number;
} = {}) {
  const apiPrefix = options.apiPrefix || '/auth';
  const router = createAuthRouter(options);
  
  app.use(apiPrefix, router);
  
  // Add verify endpoint for magic links
  app.get('/verify', (req: Request, res: Response) => {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).send(`
        <html>
          <head>
            <title>Verification Failed</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; text-align: center; }
              .error { color: #e74c3c; }
            </style>
          </head>
          <body>
            <h1 class="error">Verification Failed</h1>
            <p>Invalid or missing token.</p>
          </body>
        </html>
      `);
    }
    
    // Redirect to frontend or serve verification page
    const redirectUrl = options.loginRedirectUrl || `/verify-success?token=${token}`;
    
    if (redirectUrl.startsWith('http')) {
      // External URL, use actual redirect
      return res.redirect(`${redirectUrl}${redirectUrl.includes('?') ? '&' : '?'}token=${token}`);
    } else {
      // Render verification page
      res.send(`
        <html>
          <head>
            <title>Verifying...</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; text-align: center; }
              .success { color: #27ae60; }
              .error { color: #e74c3c; }
              #loading { display: block; }
              #result { display: none; }
              #token { word-break: break-all; font-family: monospace; background: #f5f5f5; padding: 10px; border-radius: 3px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div id="loading">
              <h1>Verifying your login...</h1>
              <p>Please wait while we verify your login.</p>
            </div>
            <div id="result"></div>
            <script>
              fetch('${apiPrefix}/verify-magic-link', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  token: "${token}"
                })
              })
              .then(response => response.json())
              .then(data => {
                document.getElementById('loading').style.display = 'none';
                document.getElementById('result').style.display = 'block';
                
                if (data.success) {
                  document.getElementById('result').innerHTML = \`
                    <h1 class="success">Successfully Verified!</h1>
                    <p>You have been successfully authenticated.</p>
                    <p>Your session token:</p>
                    <div id="token">\${data.token}</div>
                    <p>You can now use this token for authenticated requests.</p>
                  \`;
                } else {
                  document.getElementById('result').innerHTML = \`
                    <h1 class="error">Verification Failed</h1>
                    <p>\${data.message}</p>
                  \`;
                }
              })
              .catch(error => {
                document.getElementById('loading').style.display = 'none';
                document.getElementById('result').style.display = 'block';
                document.getElementById('result').innerHTML = \`
                  <h1 class="error">Verification Failed</h1>
                  <p>An error occurred during verification.</p>
                \`;
              });
            </script>
          </body>
        </html>
      `);
    }
  });
}

/**
 * Complete authentication configuration for Express
 * @param app Express application instance
 * @param options Configuration options
 */
export function setupExpressAuth(app: express.Application, options: {
  loginRedirectUrl?: string;
  apiPrefix?: string;
  rateLimitMax?: number;
  rateLimitWindowMs?: number;
} = {}) {
  // Configure the Express app
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Set up authentication routes
  configureAuth(app, options);
  
  return {
    authMiddleware,
    requireAuth: authMiddleware({ required: true }),
    optionalAuth: authMiddleware({ required: false }),
  };
} 