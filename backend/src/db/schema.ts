import { integer, varchar, pgTable, serial, text, timestamp, jsonb, boolean, doublePrecision } from "drizzle-orm/pg-core";

export const Users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).unique(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 32 }).unique(),
  referralCode: varchar("referral_code", { length: 12 }).unique(),
  referredByUserId: integer("referred_by_user_id"),
  role: varchar("role", { length: 20 }).notNull().default("citizen"),
  requestedRole: varchar("requested_role", { length: 20 }),
  collectorAvailable: boolean("collector_available").notNull().default(false),
  lastLatitude: doublePrecision("last_latitude"),
  lastLongitude: doublePrecision("last_longitude"),
  lastLocationAt: timestamp("last_location_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const MobileRefreshSessions = pgTable("mobile_refresh_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => Users.id, { onDelete: "cascade" }),
  familyId: varchar("family_id", { length: 36 }).notNull(),
  tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  revokedAt: timestamp("revoked_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const MobileOtpSendLimits = pgTable("mobile_otp_send_limits", {
  phone: varchar("phone", { length: 16 }).primaryKey(),
  lastSentAt: timestamp("last_sent_at").notNull(),
  windowStartedAt: timestamp("window_started_at").notNull(),
  sendCount: integer("send_count").notNull().default(1),
});

export const Reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => Users.id).notNull(),
  location: text("location").notNull(),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  wasteType: varchar("waste_type", { length: 255 }).notNull(),
  amount: varchar("amount", { length: 255 }).notNull(),
  imageUrl: text("image_url"),
  verificationResult: jsonb("verification_result"),
  status: varchar("status", { length: 255 }).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  collectorId: integer("collector_id").references(() => Users.id),
  assignedAt: timestamp("assigned_at"),
  saleRevenue: integer("sale_revenue"),
  soldAt: timestamp("sold_at"),
});

export const Rewards = pgTable("rewards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => Users.id).notNull(),
  points: integer("points").notNull().default(0),
  level: integer("level").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isAvailable: boolean("is_available").notNull().default(true),
  description: text("description"),
  name: varchar("name", { length: 255 }).notNull(),
  collectionInfo: text("collection_info").notNull(),
});

export const CollectedWastes = pgTable("collected_wastes", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").references(() => Reports.id).notNull(),
  collectorId: integer("collector_id").references(() => Users.id).notNull(),
  collectionDate: timestamp("collection_date").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("collected"),
});

export const Notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => Users.id).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const Transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => Users.id).notNull(),
  referralId: integer("referral_id"),
  type: varchar("type", { length: 20 }).notNull(),
  amount: integer("amount").notNull(),
  description: text("description").notNull(),
  date: timestamp("date").defaultNow().notNull(),
});

export const AuditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").references(() => Users.id).notNull(),
  action: varchar("action", { length: 255 }).notNull(),
  entityType: varchar("entity_type", { length: 255 }).notNull(),
  entityId: integer("entity_id").notNull(),
  oldValue: jsonb("old_value"),
  newValue: jsonb("new_value"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
