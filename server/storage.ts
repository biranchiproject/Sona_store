import { users, apps, type User, type InsertUser, type App, type InsertApp } from "@shared/schema";
import { db } from "./db";
import { eq, ilike, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>; // username is email
  createUser(user: InsertUser): Promise<User>;

  // App operations
  getApp(id: number): Promise<App | undefined>;
  getApps(filters?: { category?: string; search?: string; status?: string; developerId?: number }): Promise<App[]>;
  createApp(app: InsertApp): Promise<App>;
  updateAppStatus(id: number, status: "approved" | "rejected" | "pending"): Promise<App | undefined>;
  deleteApp(id: number): Promise<void>;
  
  // Admin operations
  getStats(): Promise<{ totalApps: number; pendingApps: number; totalUsers: number }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getApp(id: number): Promise<App | undefined> {
    const [app] = await db.select().from(apps).where(eq(apps.id, id));
    return app;
  }

  async getApps(filters?: { category?: string; search?: string; status?: string; developerId?: number }): Promise<App[]> {
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
        ilike(apps.name, `%${filters.search}%`)
      );
    }

    return db.select()
      .from(apps)
      .where(and(...conditions))
      .orderBy(desc(apps.createdAt));
  }

  async createApp(insertApp: InsertApp): Promise<App> {
    const [app] = await db.insert(apps).values(insertApp).returning();
    return app;
  }

  async updateAppStatus(id: number, status: "approved" | "rejected" | "pending"): Promise<App | undefined> {
    const [updatedApp] = await db
      .update(apps)
      .set({ status })
      .where(eq(apps.id, id))
      .returning();
    return updatedApp;
  }

  async deleteApp(id: number): Promise<void> {
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
