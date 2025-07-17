import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
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
  machineFilterQuerySchema
} from "./utils/queryValidation";
import { z } from "zod";
import {
  insertMachineSchema,
  insertMaintenanceScheduleSchema,
  insertMaintenanceRecordSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      // Additional safety check for user claims
      if (!req.user || !req.user.claims || !req.user.claims.sub) {
        return res.status(401).json({ message: "Invalid user session" });
      }
      
      const userId = req.user.claims.sub;
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
  app.get("/api/dashboard/stats", isAuthenticated, async (req, res) => {
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
    async (req: any, res) => {
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
    async (req: any, res) => {
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
    async (req: any, res) => {
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
    async (req: any, res) => {
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
    async (req: any, res) => {
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
    validateBody(insertMachineSchema.partial()),
    async (req: any, res) => {
      try {
        // Additional safety check for user claims
        if (!req.user || !req.user.claims || !req.user.claims.sub) {
          return res.status(401).json({ message: "Invalid user session" });
        }
        
        const { id } = req.params;
        const machineData = req.body;
        const userId = req.user.claims.sub;
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
    async (req: any, res) => {
      try {
        const { id } = req.params;
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
    async (req: any, res) => {
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
    async (req: any, res) => {
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
    async (req: any, res) => {
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
    async (req: any, res) => {
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
    validateBody(insertMaintenanceScheduleSchema.partial()),
    async (req: any, res) => {
      try {
        const { id } = req.params;
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
    async (req: any, res) => {
      try {
        const { id } = req.params;
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
    async (req: any, res) => {
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
    async (req: any, res) => {
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
    async (req: any, res) => {
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
    validateBody(insertMaintenanceRecordSchema.partial()),
    async (req: any, res) => {
      try {
        const { id } = req.params;
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
    async (req: any, res) => {
      try {
        const { id } = req.params;
        await storage.deleteMaintenanceRecord(id);
        res.status(204).send();
      } catch (error) {
        console.error("Error deleting record:", error);
        res.status(500).json({ message: "Failed to delete record" });
      }
    }
  );

  const httpServer = createServer(app);
  return httpServer;
}
