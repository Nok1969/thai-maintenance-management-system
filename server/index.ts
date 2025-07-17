import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedResponse: any;
  let responseType: string = '';

  // Override res.json to capture JSON responses
  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedResponse = bodyJson;
    responseType = 'json';
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  // Override res.send to capture other responses
  const originalResSend = res.send;
  res.send = function (body, ...args) {
    if (!capturedResponse) { // Only capture if not already captured by res.json
      capturedResponse = body;
      responseType = 'send';
    }
    return originalResSend.apply(res, [body, ...args]);
  };

  // Override res.end to capture direct end calls
  const originalResEnd = res.end;
  res.end = function (chunk, ...args) {
    if (!capturedResponse && chunk) {
      capturedResponse = chunk;
      responseType = 'end';
    }
    return originalResEnd.apply(res, [chunk, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      
      if (capturedResponse) {
        try {
          // Try to parse and stringify for consistent formatting
          const responseStr = typeof capturedResponse === 'string' 
            ? capturedResponse 
            : JSON.stringify(capturedResponse);
          
          // Limit response logging to prevent huge logs
          const truncatedResponse = responseStr.length > 200 
            ? responseStr.slice(0, 200) + "..." 
            : responseStr;
            
          logLine += ` :: ${truncatedResponse}`;
        } catch (e) {
          logLine += ` :: [${responseType} response]`;
        }
      }

      if (logLine.length > 120) {
        logLine = logLine.slice(0, 119) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error('Error:', err);
    res.status(status).json({ message });
  });

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
    log(`serving on port ${port}`);
  });
})();
