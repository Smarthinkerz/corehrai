import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

let initialized = false;

export function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    console.log("[Sentry] SENTRY_DSN not set — error tracking disabled");
    return;
  }
  if (initialized) return;

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || "development",
    release: process.env.SENTRY_RELEASE || "ai-hr-agent@1.0.0",
    integrations: [nodeProfilingIntegration()],
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    profilesSampleRate: 0.1,
    sendDefaultPii: false,
    beforeSend(event) {
      if (event.request?.cookies) delete event.request.cookies;
      if (event.request?.headers) {
        delete event.request.headers["cookie"];
        delete event.request.headers["authorization"];
        delete event.request.headers["x-csrf-token"];
      }
      return event;
    },
  });

  initialized = true;
  console.log("[Sentry] Initialized for environment:", process.env.NODE_ENV);
}

export { Sentry };
