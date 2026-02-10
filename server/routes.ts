import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { APP_CATEGORIES } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Set up authentication first
  setupAuth(app, storage);

  // === App Routes ===

  // List Apps (Public or User)
  app.get(api.apps.list.path, async (req, res) => {
    try {
      const { category, search } = req.query;
      // If not admin, only show approved apps
      const status = req.isAuthenticated() && (req.user as any).role === 'admin' ? undefined : 'approved';
      
      const apps = await storage.getApps({ 
        category: category as string, 
        search: search as string,
        status 
      });
      
      // Need to populate developer name efficiently (mocking join for now or fetch)
      // DrizzleORM relations or manual fetch. For now, let's fetch developer for each app (optimized later)
      const appsWithDev = await Promise.all(apps.map(async (app) => {
        const dev = await storage.getUser(app.developerId);
        return { ...app, developer: { name: dev?.name || 'Unknown' } };
      }));

      res.json(appsWithDev);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get App Details
  app.get(api.apps.get.path, async (req, res) => {
    try {
      const appItem = await storage.getApp(Number(req.params.id));
      if (!appItem) return res.status(404).json({ message: "App not found" });

      const dev = await storage.getUser(appItem.developerId);
      res.json({ ...appItem, developer: { name: dev?.name || 'Unknown' } });
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create App (Submit)
  app.post(api.apps.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const input = api.apps.create.input.parse(req.body);
      const newApp = await storage.createApp({
        ...input,
        developerId: (req.user as any).id,
        status: "pending", // Default to pending
        screenshots: input.screenshots || []
      });
      res.status(201).json(newApp);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get My Apps
  app.get(api.apps.myApps.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    const myApps = await storage.getApps({ developerId: (req.user as any).id });
    res.json(myApps);
  });

  // === Admin Routes ===

  // Update App Status
  app.patch(api.apps.updateStatus.path, async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== 'admin') {
      return res.status(403).send("Forbidden");
    }
    try {
      const { status } = req.body;
      const updated = await storage.updateAppStatus(Number(req.params.id), status);
      if (!updated) return res.status(404).json({ message: "App not found" });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin Stats
  app.get(api.admin.stats.path, async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== 'admin') {
      return res.status(403).send("Forbidden");
    }
    const stats = await storage.getStats();
    res.json(stats);
  });

  // Delete App
  app.delete(api.apps.delete.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const appItem = await storage.getApp(Number(req.params.id));
    if (!appItem) return res.status(404).json({ message: "App not found" });

    // Only admin or owner can delete
    if ((req.user as any).role !== 'admin' && appItem.developerId !== (req.user as any).id) {
      return res.status(403).send("Forbidden");
    }

    await storage.deleteApp(Number(req.params.id));
    res.status(204).send();
  });

  // Seed Data
  await seedDatabase(storage);

  return httpServer;
}

export async function seedDatabase(storage: any) {
  // Check if admin exists
  const existingAdmin = await storage.getUserByUsername("admin@sona.com");
  if (!existingAdmin) {
    // Create admin user
    // Password: 'password123' hashed with a static salt for seeding
    // In a real app, use the auth helper. Here we simulate a valid hash structure matching auth.ts
    // auth.ts uses: salt:hex_hash
    // We'll create a dummy user via the API logic if possible, or just insert raw
    // Let's insert raw with a placeholder hash that works if we knew the algo parameters, 
    // but since we can't easily reproduce the scrypt hash here without the util,
    // we'll skip creating the USER for now and just create APPS.
    // Users can register via the UI.
    console.log("No admin found. Please register via the UI to become admin (first user is not auto-admin, manual update needed in DB for security).");
  }

  // Seed Apps
  const apps = await storage.getApps();
  if (apps.length === 0) {
    console.log("Seeding apps...");
    // Create a dummy developer to own these apps
    let dev = await storage.getUserByUsername("dev@sona.com");
    if (!dev) {
       dev = await storage.createUser({
         email: "dev@sona.com",
         name: "Sona Dev",
         password: "scrypt_hash_placeholder", // This won't work for login but works for foreign key
         role: "user"
       });
    }

    const seedApps = [
      {
        name: "Neon Notes",
        shortDescription: "Capture your glowing thoughts.",
        fullDescription: "Neon Notes is a minimal, dark-themed note taking app designed for night owls. Syncs across devices and supports markdown.",
        iconUrl: "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=100&h=100&fit=crop",
        pwaUrl: "https://neon-notes-demo.replit.app",
        category: "Productivity",
        screenshots: [
          "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=800&q=80",
          "https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?w=800&q=80"
        ],
        status: "approved" as const,
        developerId: dev.id
      },
      {
        name: "CyberChat",
        shortDescription: "Encrypted messaging for the future.",
        fullDescription: "Stay connected with end-to-end encryption. CyberChat offers self-destructing messages, dark mode by default, and zero logs.",
        iconUrl: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=100&h=100&fit=crop",
        pwaUrl: "https://cyberchat-demo.replit.app",
        category: "Social",
        screenshots: [
          "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80"
        ],
        status: "approved" as const,
        developerId: dev.id
      },
      {
        name: "Retro Racer",
        shortDescription: "8-bit racing madness.",
        fullDescription: "Race through synthwave tracks in this PWA-exclusive racing game. High scores, global leaderboards, and controller support.",
        iconUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=100&h=100&fit=crop",
        pwaUrl: "https://retro-racer-demo.replit.app",
        category: "Games",
        screenshots: [
          "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80"
        ],
        status: "approved" as const,
        developerId: dev.id
      },
      {
        name: "Zen Focus",
        shortDescription: "Soundscapes for deep work.",
        fullDescription: "Block out distractions with curated ambient sounds. Features Pomodoro timer and usage analytics.",
        iconUrl: "https://images.unsplash.com/photo-1519834785169-98be25ec3f84?w=100&h=100&fit=crop",
        pwaUrl: "https://zen-focus-demo.replit.app",
        category: "Health & Fitness",
        screenshots: [],
        status: "pending" as const,
        developerId: dev.id
      }
    ];

    for (const app of seedApps) {
      await storage.createApp(app);
    }
    console.log("Seeding complete.");
  }
}
