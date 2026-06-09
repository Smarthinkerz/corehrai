import pino from "pino";
import pinoHttp from "pino-http";
import crypto from "crypto";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: process.env.NODE_ENV !== "production" ? {
    target: "pino/file",
    options: { destination: 1 },
  } : undefined,
  formatters: {
    level(label) {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
});

export const httpLogger = pinoHttp({
  logger,
  genReqId: () => crypto.randomUUID(),
  autoLogging: {
    ignore: (req) => {
      const url = req.url || "";
      return url.startsWith("/@") || url.startsWith("/assets/") || url.includes("__vite") || url === "/api/health";
    },
  },
  customLogLevel: (_req, res) => {
    if (res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
  customSuccessMessage: (req, res) => {
    return `${req.method} ${req.url} ${res.statusCode}`;
  },
  customErrorMessage: (req, res) => {
    return `${req.method} ${req.url} ${res.statusCode}`;
  },
});
