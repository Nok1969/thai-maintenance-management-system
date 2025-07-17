import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import { createLoggingMiddleware, logError, logInfo } from "./utils/logger";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Setup API request/response logging
app.use(createLoggingMiddleware({
  maxResponseLength: 200,
  maxLogLineLength: 120,
  logNonApiRequests: false
}));

(async () => {
  // Add error handler before registering routes
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

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
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    logInfo(`serving on port ${port}`);
  });
})();
