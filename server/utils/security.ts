import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import type { Express } from 'express';

// Rate limiting configuration
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Stricter in production
  message: {
    error: 'Too many requests from this IP',
    message: 'Please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for health checks and static assets
  skip: (req) => {
    return req.path.startsWith('/health') || 
           req.path.startsWith('/static') ||
           req.path.startsWith('/assets');
  }
});

// Strict rate limiting for authentication endpoints
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 5 : 50, // Very strict for auth
  message: {
    error: 'Too many authentication attempts',
    message: 'Please wait before trying again'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful auth attempts
});

// Helmet security headers configuration
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'", 
        "'unsafe-inline'", // For Tailwind CSS
        "https://fonts.googleapis.com"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com"
      ],
      scriptSrc: [
        "'self'",
        process.env.NODE_ENV === 'development' ? "'unsafe-eval'" : "", // For Vite HMR
      ].filter(Boolean),
      imgSrc: [
        "'self'", 
        "data:", 
        "https:", // For profile images from Replit Auth
      ],
      connectSrc: [
        "'self'",
        process.env.NODE_ENV === 'development' ? "ws://localhost:*" : "", // For Vite HMR
        "https://replit.com", // For Replit Auth
      ].filter(Boolean),
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for compatibility
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  }
});

// Apply all security middleware
export function setupSecurity(app: Express) {
  // Security headers
  app.use(helmetConfig);
  
  // Rate limiting
  app.use('/api/auth', authRateLimit); // Strict rate limiting for auth routes
  app.use('/api', apiRateLimit); // General rate limiting for API routes
  
  // Additional security headers
  app.use((req, res, next) => {
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Enable XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Referrer policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Permissions policy
    res.setHeader('Permissions-Policy', 
      'geolocation=(), microphone=(), camera=(), payment=(), usb=()');
    
    next();
  });
}

// DoS protection middleware
export const dosProtection = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: process.env.NODE_ENV === 'production' ? 20 : 200, // Very strict for DoS protection
  message: {
    error: 'Request limit exceeded',
    message: 'Server is busy, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Light rate limiting for health checks and public endpoints
export const lightRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute  
  max: process.env.NODE_ENV === 'production' ? 300 : 1000, // 300 requests per minute (prod), 1000 (dev)
  message: {
    error: "Too many health check requests from this IP, please try again later.",
    retryAfter: "1 minute"
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});