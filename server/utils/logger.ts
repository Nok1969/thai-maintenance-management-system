import type { Request, Response, NextFunction } from "express";

export interface LoggerConfig {
  maxResponseLength?: number;
  maxLogLineLength?: number;
  logNonApiRequests?: boolean;
}

const defaultConfig: LoggerConfig = {
  maxResponseLength: 200,
  maxLogLineLength: 120,
  logNonApiRequests: false,
};

export function log(message: string, source = "express") {
  const timestamp = new Date().toLocaleString('th-TH');
  console.log(`${timestamp} [${source}] ${message}`);
}

export function logApiRequest(req: Request, res: Response, config: LoggerConfig = {}) {
  const mergedConfig = { ...defaultConfig, ...config };
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
    if (!capturedResponse) {
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
    const shouldLog = path.startsWith("/api") || mergedConfig.logNonApiRequests;
    
    if (shouldLog) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      
      if (capturedResponse) {
        try {
          const responseStr = typeof capturedResponse === 'string' 
            ? capturedResponse 
            : JSON.stringify(capturedResponse);
          
          const truncatedResponse = responseStr.length > mergedConfig.maxResponseLength! 
            ? responseStr.slice(0, mergedConfig.maxResponseLength!) + "..." 
            : responseStr;
            
          logLine += ` :: ${truncatedResponse}`;
        } catch (e) {
          logLine += ` :: [${responseType} response]`;
        }
      }

      if (logLine.length > mergedConfig.maxLogLineLength!) {
        logLine = logLine.slice(0, mergedConfig.maxLogLineLength! - 1) + "…";
      }

      log(logLine);
    }
  });
}

export function createLoggingMiddleware(config?: LoggerConfig) {
  return (req: Request, res: Response, next: NextFunction) => {
    logApiRequest(req, res, config);
    next();
  };
}

// Helper functions for different log levels
export function logError(message: string, error?: any) {
  const timestamp = new Date().toLocaleString('th-TH');
  console.error(`${timestamp} [ERROR] ${message}`);
  if (error) {
    // Only log error details in development to avoid leaking sensitive info
    if (process.env.NODE_ENV === 'development') {
      console.error('Error details:', error);
    } else {
      console.error('Error type:', error?.constructor?.name || 'Unknown');
    }
  }
}

export function logInfo(message: string) {
  const timestamp = new Date().toLocaleString('th-TH');
  console.info(`${timestamp} [INFO] ${message}`);
}

export function logWarning(message: string) {
  const timestamp = new Date().toLocaleString('th-TH');
  console.warn(`${timestamp} [WARN] ${message}`);
}

export function logDebug(message: string) {
  if (process.env.NODE_ENV === 'development') {
    const timestamp = new Date().toLocaleString('th-TH');
    console.debug(`${timestamp} [DEBUG] ${message}`);
  }
}

// Performance logging helper
export function logPerformance(operation: string, startTime: number) {
  const duration = Date.now() - startTime;
  if (duration > 1000) { // Log slow operations (>1s)
    logWarning(`Slow operation: ${operation} took ${duration}ms`);
  } else if (process.env.NODE_ENV === 'development') {
    logDebug(`${operation} completed in ${duration}ms`);
  }
}