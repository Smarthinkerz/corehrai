import type { Request, Response, NextFunction, Express } from "express";

interface RouteCounter {
  count: number;
  errors: number;
  totalDurationMs: number;
}

const counters = new Map<string, RouteCounter>();
let processStart = Date.now();

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    const key = `${req.method}_${(req.route?.path || req.path || "unknown").replace(/[^a-z0-9_/]/gi, "_")}_${res.statusCode}`;
    const c = counters.get(key) || { count: 0, errors: 0, totalDurationMs: 0 };
    c.count += 1;
    c.totalDurationMs += duration;
    if (res.statusCode >= 500) c.errors += 1;
    counters.set(key, c);
  });
  next();
}

function escape(label: string): string {
  return label.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/"/g, '\\"');
}

export function metricsHandler(_req: Request, res: Response) {
  const lines: string[] = [];
  const mem = process.memoryUsage();
  const uptime = (Date.now() - processStart) / 1000;

  lines.push("# HELP process_uptime_seconds Process uptime in seconds");
  lines.push("# TYPE process_uptime_seconds gauge");
  lines.push(`process_uptime_seconds ${uptime.toFixed(2)}`);

  lines.push("# HELP process_memory_rss_bytes Resident memory bytes");
  lines.push("# TYPE process_memory_rss_bytes gauge");
  lines.push(`process_memory_rss_bytes ${mem.rss}`);

  lines.push("# HELP process_memory_heap_used_bytes Heap used bytes");
  lines.push("# TYPE process_memory_heap_used_bytes gauge");
  lines.push(`process_memory_heap_used_bytes ${mem.heapUsed}`);

  lines.push("# HELP http_requests_total Total HTTP requests");
  lines.push("# TYPE http_requests_total counter");
  for (const [key, c] of counters.entries()) {
    const [method, ...rest] = key.split("_");
    const status = rest.pop();
    const path = rest.join("_");
    lines.push(`http_requests_total{method="${escape(method)}",path="${escape(path)}",status="${escape(status || "0")}"} ${c.count}`);
  }

  lines.push("# HELP http_request_errors_total Total 5xx responses");
  lines.push("# TYPE http_request_errors_total counter");
  for (const [key, c] of counters.entries()) {
    if (!c.errors) continue;
    const [method, ...rest] = key.split("_");
    const status = rest.pop();
    const path = rest.join("_");
    lines.push(`http_request_errors_total{method="${escape(method)}",path="${escape(path)}",status="${escape(status || "0")}"} ${c.errors}`);
  }

  lines.push("# HELP http_request_duration_ms_total Sum of request durations in ms");
  lines.push("# TYPE http_request_duration_ms_total counter");
  for (const [key, c] of counters.entries()) {
    const [method, ...rest] = key.split("_");
    const status = rest.pop();
    const path = rest.join("_");
    lines.push(`http_request_duration_ms_total{method="${escape(method)}",path="${escape(path)}",status="${escape(status || "0")}"} ${c.totalDurationMs}`);
  }

  res.set("Content-Type", "text/plain; version=0.0.4");
  res.send(lines.join("\n") + "\n");
}

export function setupMetrics(app: Express) {
  app.use(metricsMiddleware);
  app.get("/metrics", metricsHandler);
}

export function resetMetrics() {
  counters.clear();
  processStart = Date.now();
}
