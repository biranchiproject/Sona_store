import { IStorage } from "./storage";
import { User, InsertUser } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);
const MemoryStore = createMemoryStore(session);

export function setupAuth(app: any, storage: IStorage) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "r8q/+&1LM3)Cd*zAGpx1xm{NeQHc;#",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }, // 30 days
    store: new MemoryStore({
      checkPeriod: 86400000,
    }),
  };

  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
    sessionSettings.cookie = {
      secure: true,
    };
  }

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Incorrect username." });
        } else {
          // Compare hashed password
          const [salt, key] = user.password.split(":");
          const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;

          if (key.length !== derivedKey.length) {
            return done(null, false, { message: "Incorrect password." });
          }

          if (timingSafeEqual(Buffer.from(key, "hex"), derivedKey)) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Incorrect password." });
          }
        }
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    done(null, (user as User).id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  app.post("/api/register", async (req: any, res: any, next: any) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.email);
      if (existingUser) {
        return res.status(400).send("User with that email already exists");
      }

      // Hash password
      const salt = randomBytes(16).toString("hex");
      const buf = (await scryptAsync(req.body.password, salt, 64)) as Buffer;
      const hashedPassword = `${salt}:${buf.toString("hex")}`;

      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
      });

      req.login(user, (err: any) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req: any, res: any) => {
    res.status(200).json(req.user);
  });

  app.post("/api/logout", (req: any, res: any, next: any) => {
    req.logout((err: any) => {
      if (err) return next(err);
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/user", (req: any, res: any) => {
    if (req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.status(401).send("Not authenticated");
    }
  });
}
