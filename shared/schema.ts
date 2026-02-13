import { pgTable, text, serial, integer, boolean, jsonb, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations, sql } from "drizzle-orm";

// === TABLE DEFINITIONS ===

export const users = pgTable("users", {
  id: text("id").primaryKey(), // UUID from Firebase/Supabase
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role", { enum: ["admin", "user"] }).default("user").notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`)
});

export const apps = pgTable("apps", {
  id: uuid("id").defaultRandom().primaryKey(), // UUID
  name: text("name").notNull(),
  shortDescription: text("short_description").notNull(),
  fullDescription: text("full_description").notNull(),
  iconUrl: text("icon_url").notNull(),
  pwa_url: text("pwa_url"),
  category: text("category").notNull(),
  screenshots: jsonb("screenshots").$type<string[]>().default([]), // Postgres has native JSONB
  apk_url: text("apk_url"),
  fileSize: integer("file_size"),
  versionName: text("version_name"),
  versionCode: integer("version_code"),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).default("pending").notNull(),
  developerId: text("developer_id").references(() => users.id).notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const reviews = pgTable("reviews", {
  id: uuid("id").defaultRandom().primaryKey(), // UUID
  appId: uuid("app_id").references(() => apps.id).notNull(),
  userId: text("user_id").references(() => users.id).notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// === RELATIONS ===

export const usersRelations = relations(users, ({ many }) => ({
  apps: many(apps),
  reviews: many(reviews),
}));

export const appsRelations = relations(apps, ({ one, many }) => ({
  developer: one(users, {
    fields: [apps.developerId],
    references: [users.id],
  }),
  reviews: many(reviews),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  app: one(apps, {
    fields: [reviews.appId],
    references: [apps.id],
  }),
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
}));

// === ZOD SCHEMAS ===

export const insertAppSchema = createInsertSchema(apps);
export const insertReviewSchema = createInsertSchema(reviews);
export const insertUserSchema = createInsertSchema(users);

export type User = typeof users.$inferSelect;
export type App = typeof apps.$inferSelect;
export type AppResponse = App;
export type Review = typeof reviews.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertApp = z.infer<typeof insertAppSchema>;
export type InsertReview = z.infer<typeof insertReviewSchema>;

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
