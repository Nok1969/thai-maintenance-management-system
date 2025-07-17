import type { Request } from "express";

// Replit Auth user claims interface
export interface ReplitUserClaims {
  sub: string;                    // Stable user ID (required)
  email?: string | null;          // User email (optional)
  first_name?: string | null;     // User first name (optional)
  last_name?: string | null;      // User last name (optional)
  profile_image_url?: string;     // Profile image URL (optional)
  iat?: number;                   // Issued at timestamp
  exp?: number;                   // Expiration timestamp
}

// Extended user session interface
export interface UserSession {
  claims: ReplitUserClaims;
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
}

// Express Request with authenticated user
export interface AuthenticatedRequest extends Request {
  user: UserSession;
  isAuthenticated(): this is AuthenticatedRequest;
}

// Optional version for routes that may or may not be authenticated
export interface OptionalAuthRequest extends Request {
  user?: UserSession;
  isAuthenticated(): this is AuthenticatedRequest;
}

// Type guard to check if request is authenticated
export function isAuthenticatedRequest(req: Request): req is AuthenticatedRequest {
  return !!(req as any).user && !!(req as any).user.claims && !!(req as any).user.claims.sub;
}

// Utility type for extracting user ID from authenticated request
export type UserId = string;

// Helper function to safely get user ID from authenticated request
export function getUserId(req: AuthenticatedRequest): UserId {
  return req.user.claims.sub;
}

// Helper function to safely get user email from authenticated request
export function getUserEmail(req: AuthenticatedRequest): string | null {
  return req.user.claims.email || null;
}

// Helper function to get user display name
export function getUserDisplayName(req: AuthenticatedRequest): string {
  const { first_name, last_name, email } = req.user.claims;
  
  if (first_name && last_name) {
    return `${first_name} ${last_name}`;
  }
  
  if (first_name) {
    return first_name;
  }
  
  if (email) {
    return email.split('@')[0]; // Use email prefix as fallback
  }
  
  return `User ${req.user.claims.sub}`;
}