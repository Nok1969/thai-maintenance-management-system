// Input validation utilities for API routes

/**
 * Safely parse and validate numeric ID from request parameters
 * @param value - The parameter value to parse
 * @param fieldName - Name of the field for error messages
 * @returns The parsed number or throws an error
 */
export function parsePositiveInteger(value: string, fieldName: string = "ID"): number {
  const parsed = Number(value);
  
  if (isNaN(parsed)) {
    throw new Error(`Invalid ${fieldName}: not a number`);
  }
  
  if (!Number.isInteger(parsed)) {
    throw new Error(`Invalid ${fieldName}: must be an integer`);
  }
  
  if (parsed <= 0) {
    throw new Error(`Invalid ${fieldName}: must be positive`);
  }
  
  return parsed;
}

/**
 * Safely parse optional numeric query parameters
 * @param value - The query parameter value
 * @param defaultValue - Default value if not provided or invalid
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns The parsed number or default value
 */
export function parseOptionalNumber(
  value: string | undefined,
  defaultValue: number,
  min?: number,
  max?: number
): number {
  if (!value) return defaultValue;
  
  const parsed = Number(value);
  if (isNaN(parsed)) return defaultValue;
  
  if (min !== undefined && parsed < min) return defaultValue;
  if (max !== undefined && parsed > max) return defaultValue;
  
  return parsed;
}

/**
 * Validate environment variable port number
 * @param port - Port value from environment
 * @returns Validated port number
 */
export function validatePort(port: string | undefined): number {
  const defaultPort = 5000;
  
  if (!port) return defaultPort;
  
  const parsed = Number(port);
  if (isNaN(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error(`Invalid PORT value: ${port}. Must be a number between 1-65535`);
  }
  
  return parsed;
}

/**
 * Validate date range parameters for queries
 * @param year - Year parameter
 * @param month - Month parameter (1-12)
 * @returns Validated year and month
 */
export function validateDateRange(year: string, month: string): { year: number; month: number } {
  const parsedYear = Number(year);
  const parsedMonth = Number(month);
  
  if (isNaN(parsedYear) || parsedYear < 1900 || parsedYear > 2100) {
    throw new Error(`Invalid year: ${year}. Must be between 1900-2100`);
  }
  
  if (isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
    throw new Error(`Invalid month: ${month}. Must be between 1-12`);
  }
  
  return { year: parsedYear, month: parsedMonth };
}

/**
 * Create a safe ID validation middleware for Express routes
 * @param paramName - Name of the parameter to validate
 * @param fieldName - Human-readable field name for errors
 */
export function validateIdParam(paramName: string = 'id', fieldName: string = 'ID') {
  return (req: any, res: any, next: any) => {
    try {
      const value = req.params[paramName];
      if (!value) {
        return res.status(400).json({ message: `Missing ${fieldName}` });
      }
      
      const id = parsePositiveInteger(value, fieldName);
      req.validatedId = id; // Store validated ID for route handler
      next();
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  };
}