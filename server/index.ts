import { initSentry, Sentry } from "./sentry";
initSentry();

import { z } from "zod";
const _envCheck = z.object({
  DATABASE_URL: z.string({ required_error: "DATABASE_URL is required — set it in Replit Secrets and restart" }),
}).safeParse(process.env);
if (!_envCheck.success) {
  console.error("[BOOT FATAL] Environment validation failed:", _envCheck.error.issues[0]?.message);
  process.exit(1);
}

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { seedDatabase } from "./seed";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await seedDatabase();
  const server = await registerRoutes(app);

  Sentry.setupExpressErrorHandler(app);

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const error = err as any;
    const status = error.status || error.statusCode || 500;
    const message = error.message || "Internal Server Error";

    if (status >= 500 && process.env.SENTRY_DSN) {
      Sentry.captureException(error);
    }

    res.status(status).json({ message });
    console.error("Server error:", error);
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Serve both the API and the client on a single port.
  // Use the host's injected PORT (e.g. Railway) when present,
  // falling back to 5000 for local/Replit development.
  const port = Number(process.env.PORT) || 5000;
  const host = "0.0.0.0";
  server.listen(port, host, () => {
    log(`serving on ${host}:${port}`);
  });
})();
