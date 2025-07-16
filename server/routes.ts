import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
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
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
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

  app.get("/api/dashboard/upcoming-maintenance", isAuthenticated, async (req, res) => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      const upcomingMaintenance = await storage.getUpcomingMaintenanceSchedules(days);
      res.json(upcomingMaintenance);
    } catch (error) {
      console.error("Error fetching upcoming maintenance:", error);
      res.status(500).json({ message: "Failed to fetch upcoming maintenance" });
    }
  });

  app.get("/api/dashboard/calendar/:year/:month", isAuthenticated, async (req, res) => {
    try {
      const year = parseInt(req.params.year);
      const month = parseInt(req.params.month);
      const calendarData = await storage.getMaintenanceCalendarData(year, month);
      res.json(calendarData);
    } catch (error) {
      console.error("Error fetching calendar data:", error);
      res.status(500).json({ message: "Failed to fetch calendar data" });
    }
  });

  // Machine routes
  app.get("/api/machines", isAuthenticated, async (req, res) => {
    try {
      const machines = await storage.getMachines();
      res.json(machines);
    } catch (error) {
      console.error("Error fetching machines:", error);
      res.status(500).json({ message: "Failed to fetch machines" });
    }
  });

  app.get("/api/machines/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const machine = await storage.getMachine(id);
      if (!machine) {
        return res.status(404).json({ message: "Machine not found" });
      }
      res.json(machine);
    } catch (error) {
      console.error("Error fetching machine:", error);
      res.status(500).json({ message: "Failed to fetch machine" });
    }
  });

  app.post("/api/machines", isAuthenticated, async (req, res) => {
    try {
      const machineData = insertMachineSchema.parse(req.body);
      
      // Check if machine ID already exists
      const existingMachine = await storage.getMachineByMachineId(machineData.machineId);
      if (existingMachine) {
        return res.status(400).json({ message: "Machine ID already exists" });
      }
      
      const machine = await storage.createMachine(machineData);
      res.status(201).json(machine);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid machine data", errors: error.errors });
      }
      console.error("Error creating machine:", error);
      res.status(500).json({ message: "Failed to create machine" });
    }
  });

  app.put("/api/machines/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const machineData = insertMachineSchema.partial().parse(req.body);
      const machine = await storage.updateMachine(id, machineData);
      res.json(machine);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid machine data", errors: error.errors });
      }
      console.error("Error updating machine:", error);
      res.status(500).json({ message: "Failed to update machine" });
    }
  });

  app.delete("/api/machines/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteMachine(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting machine:", error);
      res.status(500).json({ message: "Failed to delete machine" });
    }
  });

  // Maintenance schedule routes
  app.get("/api/schedules", isAuthenticated, async (req, res) => {
    try {
      const schedules = await storage.getMaintenanceSchedules();
      res.json(schedules);
    } catch (error) {
      console.error("Error fetching schedules:", error);
      res.status(500).json({ message: "Failed to fetch schedules" });
    }
  });

  app.get("/api/schedules/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const schedule = await storage.getMaintenanceSchedule(id);
      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }
      res.json(schedule);
    } catch (error) {
      console.error("Error fetching schedule:", error);
      res.status(500).json({ message: "Failed to fetch schedule" });
    }
  });

  app.post("/api/schedules", isAuthenticated, async (req, res) => {
    try {
      const scheduleData = insertMaintenanceScheduleSchema.parse(req.body);
      const schedule = await storage.createMaintenanceSchedule(scheduleData);
      res.status(201).json(schedule);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid schedule data", errors: error.errors });
      }
      console.error("Error creating schedule:", error);
      res.status(500).json({ message: "Failed to create schedule" });
    }
  });

  app.put("/api/schedules/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const scheduleData = insertMaintenanceScheduleSchema.partial().parse(req.body);
      const schedule = await storage.updateMaintenanceSchedule(id, scheduleData);
      res.json(schedule);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid schedule data", errors: error.errors });
      }
      console.error("Error updating schedule:", error);
      res.status(500).json({ message: "Failed to update schedule" });
    }
  });

  app.delete("/api/schedules/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteMaintenanceSchedule(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting schedule:", error);
      res.status(500).json({ message: "Failed to delete schedule" });
    }
  });

  // Maintenance record routes
  app.get("/api/records", isAuthenticated, async (req, res) => {
    try {
      const records = await storage.getMaintenanceRecords();
      res.json(records);
    } catch (error) {
      console.error("Error fetching records:", error);
      res.status(500).json({ message: "Failed to fetch records" });
    }
  });

  app.get("/api/records/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const record = await storage.getMaintenanceRecord(id);
      if (!record) {
        return res.status(404).json({ message: "Record not found" });
      }
      res.json(record);
    } catch (error) {
      console.error("Error fetching record:", error);
      res.status(500).json({ message: "Failed to fetch record" });
    }
  });

  app.post("/api/records", isAuthenticated, async (req, res) => {
    try {
      const recordData = insertMaintenanceRecordSchema.parse(req.body);
      const record = await storage.createMaintenanceRecord(recordData);
      res.status(201).json(record);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid record data", errors: error.errors });
      }
      console.error("Error creating record:", error);
      res.status(500).json({ message: "Failed to create record" });
    }
  });

  app.put("/api/records/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const recordData = insertMaintenanceRecordSchema.partial().parse(req.body);
      const record = await storage.updateMaintenanceRecord(id, recordData);
      res.json(record);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid record data", errors: error.errors });
      }
      console.error("Error updating record:", error);
      res.status(500).json({ message: "Failed to update record" });
    }
  });

  app.delete("/api/records/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteMaintenanceRecord(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting record:", error);
      res.status(500).json({ message: "Failed to delete record" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
