import { users, apps, type User, type InsertUser, type App, type InsertApp } from "@shared/schema";
import { db } from "./db";
import { eq, like, and, desc, sql } from "drizzle-orm";
import { randomUUID } from "crypto";



export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>; // username is email
  createUser(user: InsertUser): Promise<User>;

  // App operations
  getApp(id: string): Promise<App | undefined>;
  getApps(filters?: { category?: string; search?: string; status?: string; developerId?: string }): Promise<App[]>;
  createApp(app: InsertApp & { developerId: string; status?: "pending" | "approved" | "rejected" }): Promise<App>;
  updateAppStatus(id: string, status: "approved" | "rejected" | "pending"): Promise<App | undefined>;
  deleteApp(id: string): Promise<void>;

  // Admin operations
  getStats(): Promise<{ totalApps: number; pendingApps: number; totalUsers: number }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const [user] = await db.insert(users).values({ ...insertUser, id }).returning();
    return user;
  }

  async getApp(id: string): Promise<App | undefined> {
    const [app] = await db.select().from(apps).where(eq(apps.id, id));
    return app;
  }

  async getApps(filters?: { category?: string; search?: string; status?: string; developerId?: string }): Promise<App[]> {
    let conditions = [];

    if (filters?.status) {
      conditions.push(eq(apps.status, filters.status as any));
    }

    if (filters?.category) {
      conditions.push(eq(apps.category, filters.category));
    }

    if (filters?.developerId) {
      conditions.push(eq(apps.developerId, filters.developerId));
    }

    if (filters?.search) {
      conditions.push(
        like(apps.name, `%${filters.search}%`)
      );
    }

    return db.select()
      .from(apps)
      .where(and(...conditions))
      .orderBy(desc(apps.createdAt));
  }

  async createApp(insertApp: InsertApp & { developerId: string; status?: "pending" | "approved" | "rejected" }): Promise<App> {
    const [app] = await db.insert(apps).values({
      name: insertApp.name,
      shortDescription: insertApp.shortDescription,
      fullDescription: insertApp.fullDescription,
      iconUrl: insertApp.iconUrl,
      pwa_url: insertApp.pwa_url,
      apk_url: insertApp.apk_url,
      category: insertApp.category,
      screenshots: (insertApp.screenshots || []) as string[],
      fileSize: insertApp.fileSize,
      versionName: insertApp.versionName,
      versionCode: insertApp.versionCode,
      status: insertApp.status || "pending",
      developerId: insertApp.developerId,
    }).returning();

    return app;
  }

  async updateAppStatus(id: string, status: "approved" | "rejected" | "pending"): Promise<App | undefined> {
    const [updatedApp] = await db
      .update(apps)
      .set({ status })
      .where(eq(apps.id, id))
      .returning();
    return updatedApp;
  }

  async deleteApp(id: string): Promise<void> {
    await db.delete(apps).where(eq(apps.id, id));
  }

  async getStats(): Promise<{ totalApps: number; pendingApps: number; totalUsers: number }> {
    const [appStats] = await db.select({
      total: sql<number>`count(*)`,
      pending: sql<number>`count(*) filter (where ${eq(apps.status, 'pending')})`
    }).from(apps);

    const [userStats] = await db.select({
      total: sql<number>`count(*)`
    }).from(users);

    return {
      totalApps: Number(appStats?.total || 0),
      pendingApps: Number(appStats?.pending || 0),
      totalUsers: Number(userStats?.total || 0)
    };
  }
}

export const storage = new DatabaseStorage();
