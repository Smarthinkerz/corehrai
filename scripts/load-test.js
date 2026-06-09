#!/usr/bin/env node
/**
 * Lightweight load test runner (k6 alternative for environments without k6).
 *
 * Usage:
 *   node scripts/load-test.js --scenario=auth   --users=200 --duration=30
 *   node scripts/load-test.js --scenario=browse --users=500 --duration=60
 *   node scripts/load-test.js --scenario=report --users=100 --duration=30
 *
 * Outputs latency percentiles, throughput, error rate.
 */

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [k, v] = arg.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);

const BASE_URL = args.baseUrl || process.env.BASE_URL || "http://localhost:5000";
const SCENARIO = args.scenario || "browse";
const USERS = parseInt(args.users || "100", 10);
const DURATION = parseInt(args.duration || "30", 10);

const scenarios = {
  auth: async () => fetch(`${BASE_URL}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "sarah.johnson", password: "Welcome1!" }),
  }),
  browse: async (cookie) => fetch(`${BASE_URL}/api/employees?page=1&limit=25`, {
    headers: cookie ? { Cookie: cookie } : {},
  }),
  report: async (cookie) => fetch(`${BASE_URL}/api/health`, {
    headers: cookie ? { Cookie: cookie } : {},
  }),
};

async function getSessionCookie() {
  const res = await fetch(`${BASE_URL}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "sarah.johnson", password: "Welcome1!" }),
  });
  return res.headers.get("set-cookie") || "";
}

function percentile(arr, p) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

async function runWorker(cookie, deadline, latencies, counters) {
  while (Date.now() < deadline) {
    const t0 = Date.now();
    try {
      const res = await scenarios[SCENARIO](cookie);
      const ms = Date.now() - t0;
      latencies.push(ms);
      counters.total++;
      if (!res.ok) counters.errors++;
    } catch {
      counters.total++;
      counters.errors++;
    }
  }
}

(async () => {
  console.log(`\nLoad test → ${SCENARIO}, users=${USERS}, duration=${DURATION}s, target=${BASE_URL}`);
  const cookie = SCENARIO !== "auth" ? await getSessionCookie() : "";
  const latencies = [];
  const counters = { total: 0, errors: 0 };
  const deadline = Date.now() + DURATION * 1000;

  const workers = Array.from({ length: USERS }, () =>
    runWorker(cookie, deadline, latencies, counters)
  );
  const start = Date.now();
  await Promise.all(workers);
  const elapsed = (Date.now() - start) / 1000;

  const summary = {
    scenario: SCENARIO,
    users: USERS,
    duration_s: elapsed,
    requests: counters.total,
    errors: counters.errors,
    error_rate_pct: ((counters.errors / Math.max(1, counters.total)) * 100).toFixed(3),
    throughput_rps: (counters.total / elapsed).toFixed(1),
    latency_p50_ms: percentile(latencies, 50),
    latency_p95_ms: percentile(latencies, 95),
    latency_p99_ms: percentile(latencies, 99),
    latency_max_ms: latencies.length ? Math.max(...latencies) : 0,
  };

  console.log("\n=== Results ===");
  console.table(summary);

  const fs = await import("fs");
  fs.writeFileSync("load-test-results.json", JSON.stringify(summary, null, 2));
  console.log("Wrote load-test-results.json");
})();
