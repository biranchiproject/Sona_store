import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// === TABLE DEFINITIONS ===

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(), // Will be hashed (or mock for now)
  name: text("name").notNull(),
  role: text("role", { enum: ["admin", "user"] }).default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const apps = pgTable("apps", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  shortDescription: text("short_description").notNull(),
  fullDescription: text("full_description").notNull(),
  iconUrl: text("icon_url").notNull(),
  pwaUrl: text("pwa_url").notNull(),
  category: text("category").notNull(),
  screenshots: text("screenshots").array(), // Array of URLs
  status: text("status", { enum: ["pending", "approved", "rejected"] }).default("pending").notNull(),
  developerId: integer("developer_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===

export const appsRelations = relations(apps, ({ one }) => ({
  developer: one(users, {
    fields: [apps.developerId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  apps: many(apps),
}));

// === BASE SCHEMAS ===

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, role: true });
// Allow explicit role setting for seeding, but usually default to user
export const seedUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });

export const insertAppSchema = createInsertSchema(apps).omit({ 
  id: true, 
  createdAt: true, 
  status: true, 
  developerId: true,
  screenshots: true // Handle separately or as optional
}).extend({
  screenshots: z.array(z.string()).optional(),
});

// === EXPLICIT API CONTRACT TYPES ===

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type App = typeof apps.$inferSelect;
export type InsertApp = z.infer<typeof insertAppSchema>;

// Request types
export type LoginRequest = { email: string; password: string }; // Custom login
export type RegisterRequest = InsertUser;
export type CreateAppRequest = InsertApp;
export type UpdateAppStatusRequest = { status: "approved" | "rejected" | "pending" };

// Response types
export type AuthResponse = User;
export type AppResponse = App & { developer?: { name: string } };

// Enums for frontend usage
export const APP_CATEGORIES = [
  "Games",
  "Productivity",
  "Social",
  "Utilities",
  "Entertainment",
  "Education",
  "Finance",
  "Health & Fitness"
] as const;
