import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { dosProtection, lightRateLimit } from "./utils/security";
import { parsePositiveInteger, parseOptionalNumber, validateDateRange } from "./utils/validation";
import { 
  validateQuery, 
  validateParams, 
  validateBody,
  dashboardQuerySchema,
  dateParamSchema,
  idParamSchema,
  paginationQuerySchema,
  dateFilterQuerySchema,
  machineFilterQuerySchema,
  updateMachineSchema,
  updateMaintenanceScheduleSchema,
  updateMaintenanceRecordSchema
} from "./utils/queryValidation";
import { z } from "zod";
import {
  insertMachineSchema,
  insertMaintenanceScheduleSchema,
  insertMaintenanceRecordSchema,
  type UpdateMachine,
  type UpdateMaintenanceSchedule,
  type UpdateMaintenanceRecord,
} from "@shared/schema";
import type { AuthenticatedRequest, OptionalAuthRequest } from "@shared/types";
import { getUserId, isAuthenticatedRequest } from "@shared/types";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint (no authentication required)
  app.get("/api/health", lightRateLimit, (_, res) => {
    res.status(200).json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development"
    });
  });

  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard routes
  app.get("/api/dashboard/stats", isAuthenticated, dosProtection, async (req: AuthenticatedRequest, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/dashboard/upcoming-maintenance", 
    isAuthenticated, 
    validateQuery(dashboardQuerySchema), 
    async (req: AuthenticatedRequest, res) => {
      try {
        const { days } = req.query;
        const upcomingMaintenance = await storage.getUpcomingMaintenanceSchedules(days);
        res.json(upcomingMaintenance);
      } catch (error) {
        console.error("Error fetching upcoming maintenance:", error);
        res.status(500).json({ message: "Failed to fetch upcoming maintenance" });
      }
    }
  );

  app.get("/api/dashboard/calendar/:year/:month", 
    isAuthenticated,
    validateParams(dateParamSchema),
    async (req: AuthenticatedRequest, res) => {
      try {
        const { year, month } = req.params;
        const calendarData = await storage.getMaintenanceCalendarData(year, month);
        res.json(calendarData);
      } catch (error) {
        console.error("Error fetching calendar data:", error);
        res.status(500).json({ message: "Failed to fetch calendar data" });
      }
    }
  );

  // Machine routes
  app.get("/api/machines", 
    isAuthenticated, 
    validateQuery(machineFilterQuerySchema.merge(paginationQuerySchema)), 
    async (req: AuthenticatedRequest, res) => {
      try {
        const machines = await storage.getMachines();
        res.json(machines);
      } catch (error) {
        console.error("Error fetching machines:", error);
        res.status(500).json({ message: "Failed to fetch machines" });
      }
    }
  );

  app.get("/api/machines/:id", 
    isAuthenticated, 
    validateParams(idParamSchema), 
    async (req: AuthenticatedRequest, res) => {
      try {
        const { id } = req.params;
        const machine = await storage.getMachine(id);
        if (!machine) {
          return res.status(404).json({ message: "Machine not found" });
        }
        res.json(machine);
      } catch (error) {
        console.error("Error fetching machine:", error);
        res.status(500).json({ message: "Failed to fetch machine" });
      }
    }
  );

  app.post("/api/machines", 
    isAuthenticated, 
    validateBody(insertMachineSchema), 
    async (req: AuthenticatedRequest, res) => {
      try {
        const machineData = req.body;
        
        // Check if machine ID already exists
        const existingMachine = await storage.getMachineByMachineId(machineData.machineId);
        if (existingMachine) {
          return res.status(400).json({ message: "Machine ID already exists" });
        }
        
        const machine = await storage.createMachine(machineData);
        res.status(201).json(machine);
      } catch (error) {
        console.error("Error creating machine:", error);
        res.status(500).json({ message: "Failed to create machine" });
      }
    }
  );

  app.put("/api/machines/:id", 
    isAuthenticated, 
    validateParams(idParamSchema),
    validateBody(updateMachineSchema),
    async (req: AuthenticatedRequest, res) => {
      try {
        const { id } = req.params;
        
        // Check if machine exists before updating
        const existingMachine = await storage.getMachine(id);
        if (!existingMachine) {
          return res.status(404).json({ message: "Machine not found" });
        }
        
        const machineData = req.body;
        const userId = getUserId(req);
        const machine = await storage.updateMachine(id, machineData, userId);
        res.json(machine);
      } catch (error) {
        console.error("Error updating machine:", error);
        res.status(500).json({ message: "Failed to update machine" });
      }
    }
  );

  app.delete("/api/machines/:id", 
    isAuthenticated, 
    validateParams(idParamSchema), 
    async (req: AuthenticatedRequest, res) => {
      try {
        const { id } = req.params;
        
        // Check if machine exists before deleting
        const existingMachine = await storage.getMachine(id);
        if (!existingMachine) {
          return res.status(404).json({ message: "Machine not found" });
        }
        
        await storage.deleteMachine(id);
        res.status(204).send();
      } catch (error) {
        console.error("Error deleting machine:", error);
        res.status(500).json({ message: "Failed to delete machine" });
      }
    }
  );

  // Machine history routes
  app.get("/api/machines/:id/history", 
    isAuthenticated, 
    validateParams(idParamSchema), 
    async (req: AuthenticatedRequest, res) => {
      try {
        const { id } = req.params;
        const history = await storage.getMachineHistory(id);
        res.json(history);
      } catch (error) {
        console.error("Error fetching machine history:", error);
        res.status(500).json({ message: "Failed to fetch machine history" });
      }
    }
  );

  // Maintenance schedule routes
  app.get("/api/schedules", 
    isAuthenticated, 
    validateQuery(dateFilterQuerySchema.merge(paginationQuerySchema)), 
    async (req: AuthenticatedRequest, res) => {
      try {
        const schedules = await storage.getMaintenanceSchedules();
        res.json(schedules);
      } catch (error) {
        console.error("Error fetching schedules:", error);
        res.status(500).json({ message: "Failed to fetch schedules" });
      }
    }
  );

  app.get("/api/schedules/:id", 
    isAuthenticated, 
    validateParams(idParamSchema), 
    async (req: AuthenticatedRequest, res) => {
      try {
        const { id } = req.params;
        const schedule = await storage.getMaintenanceSchedule(id);
        if (!schedule) {
          return res.status(404).json({ message: "Schedule not found" });
        }
        res.json(schedule);
      } catch (error) {
        console.error("Error fetching schedule:", error);
        res.status(500).json({ message: "Failed to fetch schedule" });
      }
    }
  );

  app.post("/api/schedules", 
    isAuthenticated, 
    validateBody(insertMaintenanceScheduleSchema), 
    async (req: AuthenticatedRequest, res) => {
      try {
        const scheduleData = req.body;
        const schedule = await storage.createMaintenanceSchedule(scheduleData);
        res.status(201).json(schedule);
      } catch (error) {
        console.error("Error creating schedule:", error);
        res.status(500).json({ message: "Failed to create schedule" });
      }
    }
  );

  app.put("/api/schedules/:id", 
    isAuthenticated, 
    validateParams(idParamSchema),
    validateBody(updateMaintenanceScheduleSchema),
    async (req: AuthenticatedRequest, res) => {
      try {
        const { id } = req.params;
        
        // Check if schedule exists before updating
        const existingSchedule = await storage.getMaintenanceSchedule(id);
        if (!existingSchedule) {
          return res.status(404).json({ message: "Schedule not found" });
        }
        
        const scheduleData = req.body;
        const schedule = await storage.updateMaintenanceSchedule(id, scheduleData);
        res.json(schedule);
      } catch (error) {
        console.error("Error updating schedule:", error);
        res.status(500).json({ message: "Failed to update schedule" });
      }
    }
  );

  app.delete("/api/schedules/:id", 
    isAuthenticated, 
    validateParams(idParamSchema), 
    async (req: AuthenticatedRequest, res) => {
      try {
        const { id } = req.params;
        
        // Check if schedule exists before deleting
        const existingSchedule = await storage.getMaintenanceSchedule(id);
        if (!existingSchedule) {
          return res.status(404).json({ message: "Schedule not found" });
        }
        
        await storage.deleteMaintenanceSchedule(id);
        res.status(204).send();
      } catch (error) {
        console.error("Error deleting schedule:", error);
        res.status(500).json({ message: "Failed to delete schedule" });
      }
    }
  );

  // Maintenance record routes
  app.get("/api/records", 
    isAuthenticated, 
    validateQuery(dateFilterQuerySchema.merge(paginationQuerySchema)), 
    async (req: AuthenticatedRequest, res) => {
      try {
        const records = await storage.getMaintenanceRecords();
        res.json(records);
      } catch (error) {
        console.error("Error fetching records:", error);
        res.status(500).json({ message: "Failed to fetch records" });
      }
    }
  );

  app.get("/api/records/:id", 
    isAuthenticated, 
    validateParams(idParamSchema), 
    async (req: AuthenticatedRequest, res) => {
      try {
        const { id } = req.params;
        const record = await storage.getMaintenanceRecord(id);
        if (!record) {
          return res.status(404).json({ message: "Record not found" });
        }
        res.json(record);
      } catch (error) {
        console.error("Error fetching record:", error);
        res.status(500).json({ message: "Failed to fetch record" });
      }
    }
  );

  app.post("/api/records", 
    isAuthenticated, 
    validateBody(insertMaintenanceRecordSchema), 
    async (req: AuthenticatedRequest, res) => {
      try {
        const recordData = req.body;
        const record = await storage.createMaintenanceRecord(recordData);
        res.status(201).json(record);
      } catch (error) {
        console.error("Error creating record:", error);
        res.status(500).json({ message: "Failed to create record" });
      }
    }
  );

  app.put("/api/records/:id", 
    isAuthenticated, 
    validateParams(idParamSchema),
    validateBody(updateMaintenanceRecordSchema),
    async (req: AuthenticatedRequest, res) => {
      try {
        const { id } = req.params;
        
        // Check if record exists before updating
        const existingRecord = await storage.getMaintenanceRecord(id);
        if (!existingRecord) {
          return res.status(404).json({ message: "Record not found" });
        }
        
        const recordData = req.body;
        const record = await storage.updateMaintenanceRecord(id, recordData);
        res.json(record);
      } catch (error) {
        console.error("Error updating record:", error);
        res.status(500).json({ message: "Failed to update record" });
      }
    }
  );

  app.delete("/api/records/:id", 
    isAuthenticated, 
    validateParams(idParamSchema), 
    async (req: AuthenticatedRequest, res) => {
      try {
        const { id } = req.params;
        
        // Check if record exists before deleting
        const existingRecord = await storage.getMaintenanceRecord(id);
        if (!existingRecord) {
          return res.status(404).json({ message: "Record not found" });
        }
        
        await storage.deleteMaintenanceRecord(id);
        res.status(204).send();
      } catch (error) {
        console.error("Error deleting record:", error);
        res.status(500).json({ message: "Failed to delete record" });
      }
    }
  );

  // Status management routes
  app.patch("/api/records/:id/status", 
    isAuthenticated, 
    validateParams(idParamSchema),
    validateBody(z.object({
      status: z.enum(['pending', 'in_progress', 'completed', 'cancelled'])
    })),
    async (req: AuthenticatedRequest, res) => {
      try {
        const { id } = req.params;
        const { status } = req.body;
        const technicianId = getUserId(req);
        
        const updatedRecord = await storage.updateMaintenanceRecordStatus(id, status, technicianId);
        res.json(updatedRecord);
      } catch (error) {
        console.error("Error updating record status:", error);
        res.status(500).json({ message: "Failed to update record status" });
      }
    }
  );

  app.post("/api/records/:id/start", 
    isAuthenticated, 
    validateParams(idParamSchema),
    async (req: AuthenticatedRequest, res) => {
      try {
        const { id } = req.params;
        const technicianId = getUserId(req);
        
        const updatedRecord = await storage.startMaintenanceWork(id, technicianId);
        res.json(updatedRecord);
      } catch (error) {
        console.error("Error starting maintenance work:", error);
        res.status(500).json({ message: "Failed to start maintenance work" });
      }
    }
  );

  app.post("/api/records/:id/complete", 
    isAuthenticated, 
    validateParams(idParamSchema),
    async (req: AuthenticatedRequest, res) => {
      try {
        const { id } = req.params;
        const technicianId = getUserId(req);
        
        const updatedRecord = await storage.completeMaintenanceWork(id, technicianId);
        res.json(updatedRecord);
      } catch (error) {
        console.error("Error completing maintenance work:", error);
        res.status(500).json({ message: "Failed to complete maintenance work" });
      }
    }
  );

  app.post("/api/records/:id/cancel", 
    isAuthenticated, 
    validateParams(idParamSchema),
    async (req: AuthenticatedRequest, res) => {
      try {
        const { id } = req.params;
        const technicianId = getUserId(req);
        
        const updatedRecord = await storage.cancelMaintenanceWork(id, technicianId);
        res.json(updatedRecord);
      } catch (error) {
        console.error("Error cancelling maintenance work:", error);
        res.status(500).json({ message: "Failed to cancel maintenance work" });
      }
    }
  );

  const httpServer = createServer(app);
  return httpServer;
}
