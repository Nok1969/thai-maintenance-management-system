import { z } from "zod";
import { insertMachineSchema, insertMaintenanceScheduleSchema, insertMaintenanceRecordSchema } from "@shared/schema";
import type { Request, Response } from "express";

// Query parameter validation schemas
export const dashboardQuerySchema = z.object({
  days: z.string()
    .regex(/^\d+$/, "Days must be a positive number")
    .transform(Number)
    .refine(val => val >= 1 && val <= 365, "Days must be between 1 and 365")
    .optional()
    .default(30)
});

export const paginationQuerySchema = z.object({
  page: z.string()
    .regex(/^\d+$/, "Page must be a positive number")
    .transform(Number)
    .refine(val => val >= 1, "Page must be at least 1")
    .optional()
    .default(1),
  limit: z.string()
    .regex(/^\d+$/, "Limit must be a positive number")
    .transform(Number)
    .refine(val => val >= 1 && val <= 100, "Limit must be between 1 and 100")
    .optional()
    .default(10)
});

export const dateFilterQuerySchema = z.object({
  startDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format")
    .optional(),
  endDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format")
    .optional(),
  status: z.enum(['pending', 'completed', 'overdue', 'cancelled'])
    .optional()
});

export const machineFilterQuerySchema = z.object({
  location: z.string()
    .min(1, "Location cannot be empty")
    .optional(),
  status: z.enum(['operational', 'maintenance', 'offline'])
    .optional(),
  type: z.string()
    .min(1, "Type cannot be empty")
    .optional()
});

// Update schemas - derived from insert schemas but with excluded fields
export const updateMachineSchema = insertMachineSchema.omit({
  machineId: true, // Exclude immutable machineId from updates
}).partial();

export const updateMaintenanceScheduleSchema = insertMaintenanceScheduleSchema.omit({
  scheduleId: true, // Exclude immutable scheduleId from updates
  machineId: true,  // Exclude immutable machineId from updates
}).partial();

export const updateMaintenanceRecordSchema = insertMaintenanceRecordSchema.omit({
  recordId: true,     // Exclude immutable recordId from updates
  machineId: true,    // Exclude immutable machineId from updates
  scheduleId: true,   // Exclude immutable scheduleId from updates
  technicianId: true, // Exclude immutable technicianId from updates
}).partial();

// Generic query validation middleware
export function validateQuery<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: any) => {
    const parsed = schema.safeParse(req.query);
    
    if (!parsed.success) {
      const errors = parsed.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      
      return res.status(400).json({
        message: "Invalid query parameters",
        errors
      });
    }
    
    // Replace req.query with validated and transformed data
    req.query = parsed.data;
    next();
  };
}

// Route parameter validation schemas
export const idParamSchema = z.object({
  id: z.string()
    .regex(/^\d+$/, "ID must be a positive number")
    .transform(Number)
    .refine(val => val > 0, "ID must be positive")
});

export const dateParamSchema = z.object({
  year: z.string()
    .regex(/^\d{4}$/, "Year must be a 4-digit number")
    .transform(Number)
    .refine(val => val >= 1900 && val <= 2100, "Year must be between 1900 and 2100"),
  month: z.string()
    .regex(/^(0?[1-9]|1[0-2])$/, "Month must be between 1 and 12")
    .transform(Number)
    .refine(val => val >= 1 && val <= 12, "Month must be between 1 and 12")
});

// Generic parameter validation middleware
export function validateParams<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: any) => {
    const parsed = schema.safeParse(req.params);
    
    if (!parsed.success) {
      const errors = parsed.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      
      return res.status(400).json({
        message: "Invalid route parameters",
        errors
      });
    }
    
    // Replace req.params with validated and transformed data
    req.params = parsed.data;
    next();
  };
}

// Body validation middleware (for completeness)
export function validateBody<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: any) => {
    const parsed = schema.safeParse(req.body);
    
    if (!parsed.success) {
      const errors = parsed.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      
      return res.status(400).json({
        message: "Invalid request body",
        errors
      });
    }
    
    req.body = parsed.data;
    next();
  };
}