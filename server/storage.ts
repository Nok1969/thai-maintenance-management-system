import {
  users,
  machines,
  maintenanceSchedules,
  maintenanceRecords,
  machineHistory,
  type User,
  type UpsertUser,
  type Machine,
  type InsertMachine,
  type UpdateMachine,
  type MaintenanceSchedule,
  type InsertMaintenanceSchedule,
  type UpdateMaintenanceSchedule,
  type MaintenanceRecord,
  type InsertMaintenanceRecord,
  type UpdateMaintenanceRecord,
  type MachineHistory,
  type InsertMachineHistory,
  type MachineWithSchedules,
  type MaintenanceScheduleWithMachine,
  type MaintenanceRecordWithDetails,
  type MachineHistoryWithDetails,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, gte, lte, isNull, or, like, sql } from "drizzle-orm";
import { withDatabaseErrorHandling } from "./utils/dbErrors";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Machine operations
  getMachines(): Promise<Machine[]>;
  getMachine(id: number): Promise<MachineWithSchedules | undefined>;
  getMachineByMachineId(machineId: string): Promise<Machine | undefined>;
  createMachine(machine: InsertMachine): Promise<Machine>;
  updateMachine(id: number, machine: UpdateMachine, changedBy?: string): Promise<Machine>;
  deleteMachine(id: number): Promise<void>;

  // Maintenance schedule operations
  getMaintenanceSchedules(): Promise<MaintenanceScheduleWithMachine[]>;
  getMaintenanceSchedule(id: number): Promise<MaintenanceScheduleWithMachine | undefined>;
  getUpcomingMaintenanceSchedules(days?: number): Promise<MaintenanceScheduleWithMachine[]>;
  getOverdueMaintenanceSchedules(): Promise<MaintenanceScheduleWithMachine[]>;
  createMaintenanceSchedule(schedule: InsertMaintenanceSchedule): Promise<MaintenanceSchedule>;
  updateMaintenanceSchedule(id: number, schedule: UpdateMaintenanceSchedule): Promise<MaintenanceSchedule>;
  deleteMaintenanceSchedule(id: number): Promise<void>;

  // Maintenance record operations
  getMaintenanceRecords(): Promise<MaintenanceRecordWithDetails[]>;
  getMaintenanceRecord(id: number): Promise<MaintenanceRecordWithDetails | undefined>;
  getMaintenanceRecordsByMachine(machineId: number): Promise<MaintenanceRecordWithDetails[]>;
  getMaintenanceRecordsByTechnician(technicianId: string): Promise<MaintenanceRecordWithDetails[]>;
  createMaintenanceRecord(record: InsertMaintenanceRecord): Promise<MaintenanceRecord>;
  updateMaintenanceRecord(id: number, record: UpdateMaintenanceRecord): Promise<MaintenanceRecord>;
  deleteMaintenanceRecord(id: number): Promise<void>;

  // Dashboard statistics
  getDashboardStats(): Promise<{
    totalMachines: number;
    pendingMaintenance: number;
    completedThisMonth: number;
    overdue: number;
  }>;

  // Calendar data
  getMaintenanceCalendarData(year: number, month: number): Promise<{
    date: string;
    maintenanceCount: number;
    status: 'scheduled' | 'pending' | 'overdue';
  }[]>;

  // Machine history operations
  getMachineHistory(machineId: number): Promise<MachineHistoryWithDetails[]>;
  createMachineHistory(history: InsertMachineHistory): Promise<MachineHistory>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    return withDatabaseErrorHandling(async () => {
      const [user] = await db
        .insert(users)
        .values(userData)
        .onConflictDoUpdate({
          target: users.id,
          set: {
            ...userData,
            updatedAt: new Date(),
          },
        })
        .returning();
      return user;
    }, 'User upsert');
  }

  // Machine operations
  async getMachines(): Promise<Machine[]> {
    return await db.select().from(machines).orderBy(asc(machines.name));
  }

  async getMachine(id: number): Promise<MachineWithSchedules | undefined> {
    const [machine] = await db.select().from(machines).where(eq(machines.id, id));
    if (!machine) return undefined;

    const schedules = await db
      .select()
      .from(maintenanceSchedules)
      .where(eq(maintenanceSchedules.machineId, id));

    const records = await db
      .select()
      .from(maintenanceRecords)
      .where(eq(maintenanceRecords.machineId, id))
      .orderBy(desc(maintenanceRecords.maintenanceDate));

    return {
      ...machine,
      maintenanceSchedules: schedules,
      maintenanceRecords: records,
    };
  }

  async getMachineByMachineId(machineId: string): Promise<Machine | undefined> {
    const [machine] = await db.select().from(machines).where(eq(machines.machineId, machineId));
    return machine;
  }

  async createMachine(machine: InsertMachine): Promise<Machine> {
    return withDatabaseErrorHandling(async () => {
      const [newMachine] = await db.insert(machines).values(machine).returning();
      return newMachine;
    }, 'Machine creation');
  }

  async updateMachine(id: number, machine: UpdateMachine, changedBy?: string): Promise<Machine> {
    // Get the old machine data for history tracking
    const oldMachine = await this.getMachine(id);
    
    const updatedMachine = await withDatabaseErrorHandling(async () => {
      const result = await db
        .update(machines)
        .set({ ...machine, updatedAt: new Date() })
        .where(eq(machines.id, id))
        .returning();
      return result[0];
    }, 'Machine update');

    // Create history record if changedBy is provided
    if (changedBy && oldMachine) {
      const changes: Record<string, { old: any; new: any }> = {};
      
      // Track changes for important fields
      const fieldsToTrack = ['location', 'status', 'name', 'type', 'department'];
      fieldsToTrack.forEach(field => {
        if (machine[field as keyof UpdateMachine] !== undefined && 
            oldMachine[field as keyof Machine] !== machine[field as keyof UpdateMachine]) {
          changes[field] = {
            old: oldMachine[field as keyof Machine],
            new: machine[field as keyof UpdateMachine]
          };
        }
      });

      if (Object.keys(changes).length > 0) {
        let changeDescription = 'อัปเดตข้อมูลเครื่องจักร: ';
        const changeDescriptions = Object.entries(changes).map(([field, { old, new: newVal }]) => {
          const fieldNames: Record<string, string> = {
            location: 'ตำแหน่ง',
            status: 'สถานะ',
            name: 'ชื่อ',
            type: 'ประเภท',
            department: 'แผนก'
          };
          return `${fieldNames[field] || field}: ${old} → ${newVal}`;
        });
        changeDescription += changeDescriptions.join(', ');

        await this.createMachineHistory({
          machineId: id,
          changeType: 'updated',
          changeDescription,
          oldValues: changes,
          newValues: changes,
          changedBy,
        });
      }
    }

    return updatedMachine;
  }

  async deleteMachine(id: number): Promise<void> {
    return withDatabaseErrorHandling(async () => {
      await db.delete(machines).where(eq(machines.id, id));
    }, 'Machine deletion');
  }

  // Maintenance schedule operations
  async getMaintenanceSchedules(): Promise<MaintenanceScheduleWithMachine[]> {
    return await db
      .select({
        id: maintenanceSchedules.id,
        scheduleId: maintenanceSchedules.scheduleId,
        machineId: maintenanceSchedules.machineId,
        type: maintenanceSchedules.type,
        intervalDays: maintenanceSchedules.intervalDays,
        startDate: maintenanceSchedules.startDate,
        nextMaintenanceDate: maintenanceSchedules.nextMaintenanceDate,
        priority: maintenanceSchedules.priority,
        taskChecklist: maintenanceSchedules.taskChecklist,
        requiredParts: maintenanceSchedules.requiredParts,
        requiredTools: maintenanceSchedules.requiredTools,
        estimatedDuration: maintenanceSchedules.estimatedDuration,
        isActive: maintenanceSchedules.isActive,
        createdAt: maintenanceSchedules.createdAt,
        updatedAt: maintenanceSchedules.updatedAt,
        machine: machines,
      })
      .from(maintenanceSchedules)
      .innerJoin(machines, eq(maintenanceSchedules.machineId, machines.id))
      .where(eq(maintenanceSchedules.isActive, true))
      .orderBy(asc(maintenanceSchedules.nextMaintenanceDate));
  }

  async getMaintenanceSchedule(id: number): Promise<MaintenanceScheduleWithMachine | undefined> {
    const [result] = await db
      .select({
        id: maintenanceSchedules.id,
        scheduleId: maintenanceSchedules.scheduleId,
        machineId: maintenanceSchedules.machineId,
        type: maintenanceSchedules.type,
        intervalDays: maintenanceSchedules.intervalDays,
        startDate: maintenanceSchedules.startDate,
        nextMaintenanceDate: maintenanceSchedules.nextMaintenanceDate,
        priority: maintenanceSchedules.priority,
        taskChecklist: maintenanceSchedules.taskChecklist,
        requiredParts: maintenanceSchedules.requiredParts,
        requiredTools: maintenanceSchedules.requiredTools,
        estimatedDuration: maintenanceSchedules.estimatedDuration,
        isActive: maintenanceSchedules.isActive,
        createdAt: maintenanceSchedules.createdAt,
        updatedAt: maintenanceSchedules.updatedAt,
        machine: machines,
      })
      .from(maintenanceSchedules)
      .innerJoin(machines, eq(maintenanceSchedules.machineId, machines.id))
      .where(eq(maintenanceSchedules.id, id));
    return result;
  }

  async getUpcomingMaintenanceSchedules(days: number = 30): Promise<MaintenanceScheduleWithMachine[]> {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    return await db
      .select({
        id: maintenanceSchedules.id,
        scheduleId: maintenanceSchedules.scheduleId,
        machineId: maintenanceSchedules.machineId,
        type: maintenanceSchedules.type,
        intervalDays: maintenanceSchedules.intervalDays,
        startDate: maintenanceSchedules.startDate,
        nextMaintenanceDate: maintenanceSchedules.nextMaintenanceDate,
        priority: maintenanceSchedules.priority,
        taskChecklist: maintenanceSchedules.taskChecklist,
        requiredParts: maintenanceSchedules.requiredParts,
        requiredTools: maintenanceSchedules.requiredTools,
        estimatedDuration: maintenanceSchedules.estimatedDuration,
        isActive: maintenanceSchedules.isActive,
        createdAt: maintenanceSchedules.createdAt,
        updatedAt: maintenanceSchedules.updatedAt,
        machine: machines,
      })
      .from(maintenanceSchedules)
      .innerJoin(machines, eq(maintenanceSchedules.machineId, machines.id))
      .where(
        and(
          eq(maintenanceSchedules.isActive, true),
          gte(maintenanceSchedules.nextMaintenanceDate, today.toISOString().split('T')[0]),
          lte(maintenanceSchedules.nextMaintenanceDate, futureDate.toISOString().split('T')[0])
        )
      )
      .orderBy(asc(maintenanceSchedules.nextMaintenanceDate));
  }

  async getOverdueMaintenanceSchedules(): Promise<MaintenanceScheduleWithMachine[]> {
    const today = new Date().toISOString().split('T')[0];

    return await db
      .select({
        id: maintenanceSchedules.id,
        scheduleId: maintenanceSchedules.scheduleId,
        machineId: maintenanceSchedules.machineId,
        type: maintenanceSchedules.type,
        intervalDays: maintenanceSchedules.intervalDays,
        startDate: maintenanceSchedules.startDate,
        nextMaintenanceDate: maintenanceSchedules.nextMaintenanceDate,
        priority: maintenanceSchedules.priority,
        taskChecklist: maintenanceSchedules.taskChecklist,
        requiredParts: maintenanceSchedules.requiredParts,
        requiredTools: maintenanceSchedules.requiredTools,
        estimatedDuration: maintenanceSchedules.estimatedDuration,
        isActive: maintenanceSchedules.isActive,
        createdAt: maintenanceSchedules.createdAt,
        updatedAt: maintenanceSchedules.updatedAt,
        machine: machines,
      })
      .from(maintenanceSchedules)
      .innerJoin(machines, eq(maintenanceSchedules.machineId, machines.id))
      .where(
        and(
          eq(maintenanceSchedules.isActive, true),
          sql`${maintenanceSchedules.nextMaintenanceDate} < ${today}`
        )
      )
      .orderBy(asc(maintenanceSchedules.nextMaintenanceDate));
  }

  async createMaintenanceSchedule(schedule: InsertMaintenanceSchedule): Promise<MaintenanceSchedule> {
    return withDatabaseErrorHandling(async () => {
      const [newSchedule] = await db.insert(maintenanceSchedules).values(schedule).returning();
      return newSchedule;
    }, 'Maintenance schedule creation');
  }

  async updateMaintenanceSchedule(id: number, schedule: UpdateMaintenanceSchedule): Promise<MaintenanceSchedule> {
    return withDatabaseErrorHandling(async () => {
      const [updatedSchedule] = await db
        .update(maintenanceSchedules)
        .set({ ...schedule, updatedAt: new Date() })
        .where(eq(maintenanceSchedules.id, id))
        .returning();
      return updatedSchedule;
    }, 'Maintenance schedule update');
  }

  async deleteMaintenanceSchedule(id: number): Promise<void> {
    return withDatabaseErrorHandling(async () => {
      await db.delete(maintenanceSchedules).where(eq(maintenanceSchedules.id, id));
    }, 'Maintenance schedule deletion');
  }

  // Maintenance record operations
  async getMaintenanceRecords(): Promise<MaintenanceRecordWithDetails[]> {
    const results = await db
      .select({
        id: maintenanceRecords.id,
        recordId: maintenanceRecords.recordId,
        machineId: maintenanceRecords.machineId,
        scheduleId: maintenanceRecords.scheduleId,
        maintenanceDate: maintenanceRecords.maintenanceDate,
        type: maintenanceRecords.type,
        technicianId: maintenanceRecords.technicianId,
        workDescription: maintenanceRecords.workDescription,
        partsUsed: maintenanceRecords.partsUsed,
        cost: maintenanceRecords.cost,
        duration: maintenanceRecords.duration,
        status: maintenanceRecords.status,
        notes: maintenanceRecords.notes,
        workImages: maintenanceRecords.workImages,
        completedAt: maintenanceRecords.completedAt,
        createdAt: maintenanceRecords.createdAt,
        updatedAt: maintenanceRecords.updatedAt,
        machine: machines,
        schedule: maintenanceSchedules,
        technician: users,
      })
      .from(maintenanceRecords)
      .innerJoin(machines, eq(maintenanceRecords.machineId, machines.id))
      .leftJoin(maintenanceSchedules, eq(maintenanceRecords.scheduleId, maintenanceSchedules.id))
      .innerJoin(users, eq(maintenanceRecords.technicianId, users.id))
      .orderBy(desc(maintenanceRecords.maintenanceDate));
    
    return results as MaintenanceRecordWithDetails[];
  }

  async getMaintenanceRecord(id: number): Promise<MaintenanceRecordWithDetails | undefined> {
    const [result] = await db
      .select({
        id: maintenanceRecords.id,
        recordId: maintenanceRecords.recordId,
        machineId: maintenanceRecords.machineId,
        scheduleId: maintenanceRecords.scheduleId,
        maintenanceDate: maintenanceRecords.maintenanceDate,
        type: maintenanceRecords.type,
        technicianId: maintenanceRecords.technicianId,
        workDescription: maintenanceRecords.workDescription,
        partsUsed: maintenanceRecords.partsUsed,
        cost: maintenanceRecords.cost,
        duration: maintenanceRecords.duration,
        status: maintenanceRecords.status,
        notes: maintenanceRecords.notes,
        workImages: maintenanceRecords.workImages,
        completedAt: maintenanceRecords.completedAt,
        createdAt: maintenanceRecords.createdAt,
        updatedAt: maintenanceRecords.updatedAt,
        machine: machines,
        schedule: maintenanceSchedules,
        technician: users,
      })
      .from(maintenanceRecords)
      .innerJoin(machines, eq(maintenanceRecords.machineId, machines.id))
      .leftJoin(maintenanceSchedules, eq(maintenanceRecords.scheduleId, maintenanceSchedules.id))
      .innerJoin(users, eq(maintenanceRecords.technicianId, users.id))
      .where(eq(maintenanceRecords.id, id));
    return result as MaintenanceRecordWithDetails | undefined;
  }

  async getMaintenanceRecordsByMachine(machineId: number): Promise<MaintenanceRecordWithDetails[]> {
    const results = await db
      .select({
        id: maintenanceRecords.id,
        recordId: maintenanceRecords.recordId,
        machineId: maintenanceRecords.machineId,
        scheduleId: maintenanceRecords.scheduleId,
        maintenanceDate: maintenanceRecords.maintenanceDate,
        type: maintenanceRecords.type,
        technicianId: maintenanceRecords.technicianId,
        workDescription: maintenanceRecords.workDescription,
        partsUsed: maintenanceRecords.partsUsed,
        cost: maintenanceRecords.cost,
        duration: maintenanceRecords.duration,
        status: maintenanceRecords.status,
        notes: maintenanceRecords.notes,
        workImages: maintenanceRecords.workImages,
        completedAt: maintenanceRecords.completedAt,
        createdAt: maintenanceRecords.createdAt,
        updatedAt: maintenanceRecords.updatedAt,
        machine: machines,
        schedule: maintenanceSchedules,
        technician: users,
      })
      .from(maintenanceRecords)
      .innerJoin(machines, eq(maintenanceRecords.machineId, machines.id))
      .leftJoin(maintenanceSchedules, eq(maintenanceRecords.scheduleId, maintenanceSchedules.id))
      .innerJoin(users, eq(maintenanceRecords.technicianId, users.id))
      .where(eq(maintenanceRecords.machineId, machineId))
      .orderBy(desc(maintenanceRecords.maintenanceDate));
    
    return results as MaintenanceRecordWithDetails[];
  }

  async getMaintenanceRecordsByTechnician(technicianId: string): Promise<MaintenanceRecordWithDetails[]> {
    const results = await db
      .select({
        id: maintenanceRecords.id,
        recordId: maintenanceRecords.recordId,
        machineId: maintenanceRecords.machineId,
        scheduleId: maintenanceRecords.scheduleId,
        maintenanceDate: maintenanceRecords.maintenanceDate,
        type: maintenanceRecords.type,
        technicianId: maintenanceRecords.technicianId,
        workDescription: maintenanceRecords.workDescription,
        partsUsed: maintenanceRecords.partsUsed,
        cost: maintenanceRecords.cost,
        duration: maintenanceRecords.duration,
        status: maintenanceRecords.status,
        notes: maintenanceRecords.notes,
        workImages: maintenanceRecords.workImages,
        completedAt: maintenanceRecords.completedAt,
        createdAt: maintenanceRecords.createdAt,
        updatedAt: maintenanceRecords.updatedAt,
        machine: machines,
        schedule: maintenanceSchedules,
        technician: users,
      })
      .from(maintenanceRecords)
      .innerJoin(machines, eq(maintenanceRecords.machineId, machines.id))
      .leftJoin(maintenanceSchedules, eq(maintenanceRecords.scheduleId, maintenanceSchedules.id))
      .innerJoin(users, eq(maintenanceRecords.technicianId, users.id))
      .where(eq(maintenanceRecords.technicianId, technicianId))
      .orderBy(desc(maintenanceRecords.maintenanceDate));

    return results as MaintenanceRecordWithDetails[];
  }

  async createMaintenanceRecord(record: InsertMaintenanceRecord): Promise<MaintenanceRecord> {
    return withDatabaseErrorHandling(async () => {
      const [newRecord] = await db.insert(maintenanceRecords).values(record).returning();
      return newRecord;
    }, 'Maintenance record creation');
  }

  async updateMaintenanceRecord(id: number, record: UpdateMaintenanceRecord): Promise<MaintenanceRecord> {
    return withDatabaseErrorHandling(async () => {
      const [updatedRecord] = await db
        .update(maintenanceRecords)
        .set({ ...record, updatedAt: new Date() })
        .where(eq(maintenanceRecords.id, id))
        .returning();
      return updatedRecord;
    }, 'Maintenance record update');
  }

  async deleteMaintenanceRecord(id: number): Promise<void> {
    return withDatabaseErrorHandling(async () => {
      await db.delete(maintenanceRecords).where(eq(maintenanceRecords.id, id));
    }, 'Maintenance record deletion');
  }

  // Dashboard statistics
  async getDashboardStats(): Promise<{
    totalMachines: number;
    pendingMaintenance: number;
    completedThisMonth: number;
    overdue: number;
  }> {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Total machines
    const [totalMachinesResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(machines);
    const totalMachines = totalMachinesResult.count;

    // Pending maintenance (upcoming in next 30 days)
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + 30);
    const [pendingMaintenanceResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(maintenanceSchedules)
      .where(
        and(
          eq(maintenanceSchedules.isActive, true),
          gte(maintenanceSchedules.nextMaintenanceDate, today.toISOString().split('T')[0]),
          lte(maintenanceSchedules.nextMaintenanceDate, futureDate.toISOString().split('T')[0])
        )
      );
    const pendingMaintenance = pendingMaintenanceResult.count;

    // Completed this month
    const [completedThisMonthResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(maintenanceRecords)
      .where(
        and(
          eq(maintenanceRecords.status, "completed"),
          gte(maintenanceRecords.maintenanceDate, firstDayOfMonth.toISOString().split('T')[0]),
          lte(maintenanceRecords.maintenanceDate, lastDayOfMonth.toISOString().split('T')[0])
        )
      );
    const completedThisMonth = completedThisMonthResult.count;

    // Overdue maintenance
    const [overdueResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(maintenanceSchedules)
      .where(
        and(
          eq(maintenanceSchedules.isActive, true),
          sql`${maintenanceSchedules.nextMaintenanceDate} < ${today.toISOString().split('T')[0]}`
        )
      );
    const overdue = overdueResult.count;

    return {
      totalMachines,
      pendingMaintenance,
      completedThisMonth,
      overdue,
    };
  }

  // Calendar data
  async getMaintenanceCalendarData(year: number, month: number): Promise<{
    date: string;
    maintenanceCount: number;
    status: 'scheduled' | 'pending' | 'overdue';
  }[]> {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const today = new Date();

    const results = await db
      .select({
        date: maintenanceSchedules.nextMaintenanceDate,
        count: sql<number>`count(*)`,
      })
      .from(maintenanceSchedules)
      .where(
        and(
          eq(maintenanceSchedules.isActive, true),
          gte(maintenanceSchedules.nextMaintenanceDate, firstDay.toISOString().split('T')[0]),
          lte(maintenanceSchedules.nextMaintenanceDate, lastDay.toISOString().split('T')[0])
        )
      )
      .groupBy(maintenanceSchedules.nextMaintenanceDate);

    return results.map(result => {
      const maintenanceDate = new Date(result.date);
      const status = maintenanceDate < today ? 'overdue' : 'pending';
      
      return {
        date: result.date,
        maintenanceCount: result.count,
        status,
      };
    });
  }

  // Machine history operations
  async getMachineHistory(machineId: number): Promise<MachineHistoryWithDetails[]> {
    const results = await db
      .select({
        id: machineHistory.id,
        machineId: machineHistory.machineId,
        changeType: machineHistory.changeType,
        changeDescription: machineHistory.changeDescription,
        oldValues: machineHistory.oldValues,
        newValues: machineHistory.newValues,
        changedBy: machineHistory.changedBy,
        createdAt: machineHistory.createdAt,
        machine: machines,
        changedByUser: users,
      })
      .from(machineHistory)
      .innerJoin(machines, eq(machineHistory.machineId, machines.id))
      .innerJoin(users, eq(machineHistory.changedBy, users.id))
      .where(eq(machineHistory.machineId, machineId))
      .orderBy(desc(machineHistory.createdAt));

    return results as MachineHistoryWithDetails[];
  }

  async createMachineHistory(history: InsertMachineHistory): Promise<MachineHistory> {
    return withDatabaseErrorHandling(async () => {
      const [newHistory] = await db.insert(machineHistory).values(history).returning();
      return newHistory;
    }, 'Machine history creation');
  }
}

export const storage = new DatabaseStorage();
