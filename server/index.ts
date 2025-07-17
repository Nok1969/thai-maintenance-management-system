import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import { createLoggingMiddleware, logError, logInfo } from "./utils/logger";
import { validatePort } from "./utils/validation";
import { setupSecurity } from "./utils/security";

const app = express();

// Security: Trust proxy for proper client IP detection behind reverse proxy
app.set("trust proxy", 1);

// Apply security middleware early in the middleware stack
setupSecurity(app);

// Enhanced CORS configuration for security
const corsOrigins = process.env.NODE_ENV === 'development' 
  ? true // Allow all origins in development for easier testing
  : [
      // Production: Restrict to specific domains
      'https://*.replit.app',
      'https://*.replit.co',
      // Add custom domains if any
      ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [])
    ];

app.use(cors({
  origin: corsOrigins,
  credentials: true, // Allow cookies and auth headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'X-CSRF-Token' // Support CSRF protection
  ],
  exposedHeaders: ['X-Total-Count'], // For pagination headers
  maxAge: 86400, // Cache preflight requests for 24 hours
}));

// Security: Limit request body size to prevent DoS attacks
app.use(express.json({ 
  limit: '10mb', // Adjust based on your needs
  strict: true   // Only parse objects and arrays
}));
app.use(express.urlencoded({ 
  extended: false,
  limit: '10mb'
}));

// Setup API request/response logging
app.use(createLoggingMiddleware({
  maxResponseLength: 200,
  maxLogLineLength: 120,
  logNonApiRequests: false
}));

(async () => {
  // Security headers middleware
  app.use((_req: Request, res: Response, next: NextFunction) => {
    if (process.env.NODE_ENV === 'production') {
      // Security headers for production
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
      
      // Content Security Policy (adjust based on your needs)
      res.setHeader('Content-Security-Policy', 
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: https:; " +
        "connect-src 'self' https:; " +
        "font-src 'self' https:; " +
        "frame-ancestors 'none';"
      );
    }
    next();
  });

  // Add error handler before registering routes
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    
    // Security: Don't leak error details in production
    const message = process.env.NODE_ENV === 'production' 
      ? status >= 500 ? "Internal Server Error" : err.message || "Bad Request"
      : err.message || "Internal Server Error";

    logError(`${status} Error: ${message}`, err);
    res.status(status).json({ message });
  });

  // Register all API routes and get the HTTP server
  const server = await registerRoutes(app);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = validatePort(process.env.PORT);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    logInfo(`serving on port ${port}`);
  });
})();
