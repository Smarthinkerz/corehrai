import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import connectPgSimple from "connect-pg-simple";
import {
  createPasswordResetToken,
  validatePasswordResetToken,
  markPasswordResetTokenUsed,
  createEmailVerificationToken,
  validateEmailVerificationToken,
  markEmailVerified,
  recordLoginAttempt,
  incrementFailedLogins,
  resetFailedLogins,
  isAccountLocked,
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
} from "./services/authService";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("[SECURITY FATAL] SESSION_SECRET environment variable is required in production. Set it to a long random string (32+ chars) and restart.");
  }
  console.warn("[SECURITY WARNING] SESSION_SECRET not set. Using generated random secret for development only. Set SESSION_SECRET env var before deploying.");
}
const effectiveSecret = SESSION_SECRET || randomBytes(32).toString("hex");

export function setupAuth(app: Express) {
  const PgStore = connectPgSimple(session);

  const sessionSettings: session.SessionOptions = {
    secret: effectiveSecret,
    resave: false,
    saveUninitialized: false,
    store: new PgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
      tableName: "session",
      pruneSessionInterval: 60 * 15,
    }),
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      httpOnly: true,
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Invalid username or password" });
        }

        if (await isAccountLocked(user.id)) {
          return done(null, false, { message: "Account is temporarily locked due to too many failed login attempts. Please try again in 30 minutes." });
        }

        if (!user.isActive) {
          return done(null, false, { message: "Account is deactivated" });
        }

        if (!(await comparePasswords(password, user.password))) {
          await incrementFailedLogins(user.id);
          return done(null, false, { message: "Invalid username or password" });
        }

        await resetFailedLogins(user.id);
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail) {
        return res.status(400).json({ error: "Email is already in use" });
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      try {
        const verifyToken = await createEmailVerificationToken(user.id);
        await sendVerificationEmail(user.email, verifyToken);
        await sendWelcomeEmail(user.email, user.fullName);
      } catch (emailErr) {
        // Don't block registration if email fails
      }

      req.login(user, (err) => {
        if (err) return next(err);
        const { password, twoFactorSecret, ...userWithoutSensitive } = user;
        return res.status(201).json(userWithoutSensitive);
      });
    } catch (error) {
      return next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    const ipAddress = req.ip || req.socket.remoteAddress || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";

    passport.authenticate("local", async (err: any, user: Express.User | false, info: {message?: string}) => {
      if (err) return next(err);
      if (!user) {
        await recordLoginAttempt({
          username: req.body.username,
          ipAddress,
          userAgent,
          success: false,
          failureReason: info.message,
        });
        return res.status(401).json({ error: info.message || "Authentication failed" });
      }

      req.login(user, async (err: any) => {
        if (err) return next(err);

        await recordLoginAttempt({
          userId: user.id,
          username: user.username,
          ipAddress,
          userAgent,
          success: true,
        });

        const { password, twoFactorSecret, ...userWithoutSensitive } = user;
        return res.status(200).json(userWithoutSensitive);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy((err) => {
        if (err) return next(err);
        res.clearCookie("connect.sid");
        return res.sendStatus(200);
      });
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
    const { password, twoFactorSecret, ...userWithoutSensitive } = req.user;
    res.json(userWithoutSensitive);
  });

  app.post("/api/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);
      if (user) {
        const token = await createPasswordResetToken(user.id);
        await sendPasswordResetEmail(user.email, token);
      }

      res.json({ message: "If an account with that email exists, a password reset link has been sent." });
    } catch (error) {
      res.json({ message: "If an account with that email exists, a password reset link has been sent." });
    }
  });

  app.post("/api/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) {
        return res.status(400).json({ error: "Token and new password are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }

      const resetToken = await validatePasswordResetToken(token);
      if (!resetToken) {
        return res.status(400).json({ error: "Invalid or expired reset token" });
      }

      const hashedPassword = await hashPassword(newPassword);
      await db.update(users).set({ password: hashedPassword }).where(eq(users.id, resetToken.userId));
      await markPasswordResetTokenUsed(resetToken.id);

      res.json({ message: "Password has been reset successfully. You can now log in with your new password." });
    } catch (error) {
      res.status(500).json({ error: "Failed to reset password" });
    }
  });

  app.post("/api/verify-email", async (req, res) => {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({ error: "Verification token is required" });
      }

      const verifyToken = await validateEmailVerificationToken(token);
      if (!verifyToken) {
        return res.status(400).json({ error: "Invalid or expired verification token" });
      }

      await markEmailVerified(verifyToken.id, verifyToken.userId);

      res.json({ message: "Email has been verified successfully!" });
    } catch (error) {
      res.status(500).json({ error: "Failed to verify email" });
    }
  });

  app.post("/api/resend-verification", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const user = req.user;
      if (user.emailVerified) {
        return res.status(400).json({ error: "Email is already verified" });
      }

      const token = await createEmailVerificationToken(user.id);
      await sendVerificationEmail(user.email, token);

      res.json({ message: "Verification email sent" });
    } catch (error) {
      res.status(500).json({ error: "Failed to send verification email" });
    }
  });
}
