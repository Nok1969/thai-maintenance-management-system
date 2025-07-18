import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  decimal,
  boolean,
  date
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table with username/password authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username").notNull().unique(), // ชื่อผู้ใช้
  password: varchar("password").notNull(), // รหัสผ่าน (hashed)
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("technician"), // manager, technician, admin
  isActive: boolean("is_active").notNull().default(true), // สถานะการใช้งาน
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Machine master data
export const machines = pgTable("machines", {
  id: serial("id").primaryKey(),
  machineId: varchar("machine_id").notNull().unique(), // รหัสเครื่องจักร
  name: varchar("name").notNull(), // ชื่อเครื่องจักร
  type: varchar("type").notNull(), // ประเภทเครื่องจักร
  manufacturer: varchar("manufacturer"), // ผู้ผลิต
  model: varchar("model"), // รุ่น
  serialNumber: varchar("serial_number"), // หมายเลขเครื่อง
  installationDate: date("installation_date"), // วันที่ติดตั้ง
  location: varchar("location").notNull(), // ตำแหน่ง/แผนก
  department: varchar("department"), // แผนก
  status: varchar("status").notNull().default("operational"), // operational, maintenance, down
  manualUrl: text("manual_url"), // คู่มือการใช้งาน
  imageUrl: text("image_url"), // รูปภาพเครื่องจักร
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Maintenance schedules
export const maintenanceSchedules = pgTable("maintenance_schedules", {
  id: serial("id").primaryKey(),
  scheduleId: varchar("schedule_id").notNull().unique(), // รหัสแผนการบำรุงรักษา
  machineId: integer("machine_id").references(() => machines.id).notNull(),
  type: varchar("type").notNull(), // ประเภทการบำรุงรักษา
  intervalDays: integer("interval_days").notNull(), // รอบการบำรุงรักษา (วัน)
  startDate: date("start_date").notNull(), // วันที่เริ่มต้น
  nextMaintenanceDate: date("next_maintenance_date").notNull(), // วันที่บำรุงรักษาครั้งต่อไป
  priority: varchar("priority").notNull().default("medium"), // low, medium, high, critical
  taskChecklist: jsonb("task_checklist"), // รายการงานที่ต้องทำ
  requiredParts: jsonb("required_parts"), // อะไหล่ที่ต้องใช้
  requiredTools: jsonb("required_tools"), // เครื่องมือที่ต้องใช้
  estimatedDuration: integer("estimated_duration"), // เวลาที่ใช้ (นาที)
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Maintenance records
export const maintenanceRecords = pgTable("maintenance_records", {
  id: serial("id").primaryKey(),
  recordId: varchar("record_id").notNull().unique(), // รหัสบันทึก
  machineId: integer("machine_id").references(() => machines.id).notNull(),
  scheduleId: integer("schedule_id").references(() => maintenanceSchedules.id),
  maintenanceDate: date("maintenance_date").notNull(), // วันที่ทำการบำรุงรักษา
  type: varchar("type").notNull(), // ประเภทการบำรุงรักษา
  technicianId: integer("technician_id").references(() => users.id).notNull(), // ช่างผู้ปฏิบัติงาน
  workDescription: text("work_description").notNull(), // รายละเอียดงานที่ทำ
  partsUsed: jsonb("parts_used"), // อะไหล่ที่ใช้
  cost: decimal("cost", { precision: 10, scale: 2 }), // ค่าใช้จ่าย
  duration: integer("duration"), // เวลาที่ใช้ (นาที)
  status: varchar("status").notNull().default("pending"), // pending, in_progress, completed, cancelled
  notes: text("notes"), // หมายเหตุ
  workImages: jsonb("work_images"), // รูปภาพการทำงาน
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Machine history table for tracking machine data changes
export const machineHistory = pgTable("machine_history", {
  id: serial("id").primaryKey(),
  machineId: integer("machine_id").references(() => machines.id).notNull(),
  changeType: varchar("change_type").notNull(), // created, updated, location_changed, status_changed
  changeDescription: text("change_description").notNull(), // คำอธิบายการเปลี่ยนแปลง
  oldValues: jsonb("old_values"), // ค่าเก่าก่อนเปลี่ยนแปลง
  newValues: jsonb("new_values"), // ค่าใหม่หลังเปลี่ยนแปลง
  changedBy: integer("changed_by").references(() => users.id).notNull(), // ผู้ทำการเปลี่ยนแปลง
  createdAt: timestamp("created_at").defaultNow(),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  maintenanceRecords: many(maintenanceRecords),
}));

export const machinesRelations = relations(machines, ({ many }) => ({
  maintenanceSchedules: many(maintenanceSchedules),
  maintenanceRecords: many(maintenanceRecords),
  history: many(machineHistory),
}));

export const maintenanceSchedulesRelations = relations(maintenanceSchedules, ({ one, many }) => ({
  machine: one(machines, {
    fields: [maintenanceSchedules.machineId],
    references: [machines.id],
  }),
  maintenanceRecords: many(maintenanceRecords),
}));

export const maintenanceRecordsRelations = relations(maintenanceRecords, ({ one }) => ({
  machine: one(machines, {
    fields: [maintenanceRecords.machineId],
    references: [machines.id],
  }),
  schedule: one(maintenanceSchedules, {
    fields: [maintenanceRecords.scheduleId],
    references: [maintenanceSchedules.id],
  }),
  technician: one(users, {
    fields: [maintenanceRecords.technicianId],
    references: [users.id],
  }),
}));

export const machineHistoryRelations = relations(machineHistory, ({ one }) => ({
  machine: one(machines, {
    fields: [machineHistory.machineId],
    references: [machines.id],
  }),
  changedByUser: one(users, {
    fields: [machineHistory.changedBy],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertMachineSchema = createInsertSchema(machines).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMaintenanceScheduleSchema = createInsertSchema(maintenanceSchedules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMaintenanceRecordSchema = createInsertSchema(maintenanceRecords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMachineHistorySchema = createInsertSchema(machineHistory).omit({
  id: true,
  createdAt: true,
});

// Insert schemas for users
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const loginUserSchema = z.object({
  username: z.string().min(3, "ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร"),
  password: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
});

export const createUserSchema = z.object({
  username: z.string().min(3, "ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร"),
  password: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
  email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง").optional(),
  firstName: z.string().min(1, "กรุณาใส่ชื่อ"),
  lastName: z.string().min(1, "กรุณาใส่นามสกุล"),
  role: z.enum(["technician", "manager", "admin"]).default("technician"),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type CreateUser = z.infer<typeof createUserSchema>;
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;

// API Response Validation Schemas
export const machineSchema = z.object({
  id: z.number(),
  machineId: z.string(),
  name: z.string(),
  type: z.string(),
  manufacturer: z.string().nullable(),
  model: z.string().nullable(),
  serialNumber: z.string().nullable(),
  installationDate: z.string().nullable(),
  location: z.string(),
  department: z.string().nullable(),
  status: z.string(),
  manualUrl: z.string().nullable(),
  imageUrl: z.string().nullable(),
  specifications: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const machineArraySchema = z.array(machineSchema);

export const maintenanceScheduleSchema = z.object({
  id: z.number(),
  machineId: z.number(),
  type: z.string(),
  description: z.string().nullable(),
  frequency: z.string(),
  intervalDays: z.number(),
  estimatedDuration: z.number().nullable(),
  priority: z.string(),
  lastMaintenanceDate: z.string().nullable(),
  nextMaintenanceDate: z.string(),
  assignedTo: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const maintenanceScheduleArraySchema = z.array(maintenanceScheduleSchema);

export const maintenanceScheduleWithMachineSchema = z.object({
  id: z.number(),
  machineId: z.number(),
  scheduleId: z.string(),
  type: z.string(),
  description: z.string().nullable(),
  frequency: z.string(),
  intervalDays: z.number(),
  estimatedDuration: z.number().nullable(),
  priority: z.string(),
  lastMaintenanceDate: z.string().nullable(),
  nextMaintenanceDate: z.string(),
  assignedTo: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  machine: machineSchema,
});

export const maintenanceScheduleWithMachineArraySchema = z.array(maintenanceScheduleWithMachineSchema);

export const dashboardStatsSchema = z.object({
  totalMachines: z.string(),
  pendingMaintenance: z.string(),
  completedThisMonth: z.string(),
  overdueItems: z.string(),
});

export const maintenanceRecordWithDetailsSchema = z.object({
  id: z.number(),
  recordId: z.string(),
  machineId: z.number(),
  scheduleId: z.number().nullable(),
  technicianId: z.string(),
  maintenanceDate: z.string(),
  type: z.string(),
  workDescription: z.string().nullable(),
  partsUsed: z.string().nullable(),
  cost: z.string().nullable(),
  duration: z.number().nullable(),
  status: z.string(),
  notes: z.string().nullable(),
  workImages: z.string().nullable(),
  completedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  machine: machineSchema,
  technician: z.object({
    id: z.string(),
    firstName: z.string().nullable(),
    lastName: z.string().nullable(),
    email: z.string().nullable(),
  }),
});

export const maintenanceRecordWithDetailsArraySchema = z.array(maintenanceRecordWithDetailsSchema);

export type InsertMachine = z.infer<typeof insertMachineSchema>;
export type Machine = typeof machines.$inferSelect;
export type UpdateMachine = Partial<Pick<InsertMachine, 
  'name' | 'type' | 'location' | 'department' | 'status' | 'specifications' | 
  'installationDate' | 'warrantyExpiry' | 'notes'
>>; // Exclude machineId from updates for safety

export type InsertMaintenanceSchedule = z.infer<typeof insertMaintenanceScheduleSchema>;
export type MaintenanceSchedule = typeof maintenanceSchedules.$inferSelect;
export type UpdateMaintenanceSchedule = Partial<Pick<InsertMaintenanceSchedule,
  'type' | 'intervalDays' | 'startDate' | 'nextMaintenanceDate' | 'priority' | 
  'taskChecklist' | 'requiredParts' | 'requiredTools' | 'estimatedDuration' | 'isActive'
>>; // Exclude scheduleId and machineId from updates for safety

export type InsertMaintenanceRecord = z.infer<typeof insertMaintenanceRecordSchema>;
export type MaintenanceRecord = typeof maintenanceRecords.$inferSelect;
export type UpdateMaintenanceRecord = Partial<Pick<InsertMaintenanceRecord,
  'maintenanceDate' | 'type' | 'workDescription' | 'partsUsed' | 'cost' | 
  'duration' | 'status' | 'notes' | 'workImages' | 'completedAt'
>>; // Exclude recordId, machineId, scheduleId, technicianId from updates for safety

export type InsertMachineHistory = z.infer<typeof insertMachineHistorySchema>;
export type MachineHistory = typeof machineHistory.$inferSelect;

// Extended types with relations
export type MachineWithSchedules = Machine & {
  maintenanceSchedules: MaintenanceSchedule[];
  maintenanceRecords: MaintenanceRecord[];
};

export type MaintenanceScheduleWithMachine = MaintenanceSchedule & {
  machine: Machine;
};

export type MaintenanceRecordWithDetails = MaintenanceRecord & {
  machine: Machine;
  schedule?: MaintenanceSchedule;
  technician: User;
};

export type MachineHistoryWithDetails = MachineHistory & {
  machine: Machine;
  changedByUser: User;
};
