import type { Request, Response, NextFunction } from "express";
import { logWarning } from "./logger";

// Rate limiting store (in-memory for simplicity, use Redis in production with multiple instances)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Simple rate limiting middleware
export function createRateLimit(options: {
  windowMs: number;
  maxRequests: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip rate limiting in development
    if (process.env.NODE_ENV === 'development') {
      return next();
    }

    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    const key = `${clientIp}:${req.path}`;
    const now = Date.now();
    
    // Clean up expired entries
    if (Math.random() < 0.1) { // 10% chance to clean up
      for (const [k, v] of rateLimitStore.entries()) {
        if (v.resetTime < now) {
          rateLimitStore.delete(k);
        }
      }
    }
    
    const record = rateLimitStore.get(key);
    
    if (!record || record.resetTime < now) {
      // New window
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + options.windowMs
      });
      return next();
    }
    
    if (record.count >= options.maxRequests) {
      logWarning(`Rate limit exceeded for ${clientIp} on ${req.path}`);
      return res.status(429).json({
        message: options.message || "Too many requests, please try again later",
        retryAfter: Math.ceil((record.resetTime - now) / 1000)
      });
    }
    
    record.count++;
    next();
  };
}

// Validation helper for environment-specific features
export function requireProduction() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (process.env.NODE_ENV !== 'production') {
      return res.status(403).json({ message: "This feature is only available in production" });
    }
    next();
  };
}

// Security: Sanitize user input to prevent injection attacks
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    // Basic HTML/JS sanitization
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .trim();
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  
  if (input && typeof input === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      // Sanitize key names too
      const cleanKey = key.replace(/[^a-zA-Z0-9_]/g, '');
      if (cleanKey) {
        sanitized[cleanKey] = sanitizeInput(value);
      }
    }
    return sanitized;
  }
  
  return input;
}

// Middleware to sanitize request body
export function sanitizeRequestBody() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.body) {
      req.body = sanitizeInput(req.body);
    }
    next();
  };
}