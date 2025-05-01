import express, { Request, Response, NextFunction } from 'express';
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
export declare function authMiddleware(options?: AuthMiddlewareOptions): (req: AuthRequest, res: Response, next: NextFunction) => void | express.Response<any, Record<string, any>>;
/**
 * Configure Express router with authentication endpoints
 * @param options Configuration options
 * @returns Configured Express router
 */
export declare function createAuthRouter(options?: {
    loginRedirectUrl?: string;
    apiPrefix?: string;
    rateLimitMax?: number;
    rateLimitWindowMs?: number;
}): import("express-serve-static-core").Router;
/**
 * Configure Express app with authentication routes
 * @param app Express application
 * @param options Configuration options
 */
export declare function configureAuth(app: express.Application, options?: {
    loginRedirectUrl?: string;
    apiPrefix?: string;
    rateLimitMax?: number;
    rateLimitWindowMs?: number;
}): void;
/**
 * Complete authentication configuration for Express
 * @param app Express application instance
 * @param options Configuration options
 */
export declare function setupExpressAuth(app: express.Application, options?: {
    loginRedirectUrl?: string;
    apiPrefix?: string;
    rateLimitMax?: number;
    rateLimitWindowMs?: number;
}): {
    authMiddleware: typeof authMiddleware;
    requireAuth: (req: AuthRequest, res: Response, next: NextFunction) => void | express.Response<any, Record<string, any>>;
    optionalAuth: (req: AuthRequest, res: Response, next: NextFunction) => void | express.Response<any, Record<string, any>>;
};
export {};
