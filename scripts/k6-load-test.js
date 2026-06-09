import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate } from "k6/metrics";

const BASE_URL = __ENV.BASE_URL || "http://localhost:5000";
const errorRate = new Rate("errors");

export const options = {
  scenarios: {
    auth_storm: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "1m", target: 1000 },
        { duration: "5m", target: 1000 },
        { duration: "30s", target: 0 },
      ],
      exec: "authStorm",
    },
    browse: {
      executor: "constant-vus",
      vus: 1000,
      duration: "5m",
      exec: "browse",
      startTime: "7m",
    },
    reporting: {
      executor: "constant-vus",
      vus: 200,
      duration: "3m",
      exec: "reporting",
      startTime: "13m",
    },
  },
  thresholds: {
    "http_req_duration{scenario:browse}": ["p(95)<200", "p(99)<500"],
    "http_req_duration{scenario:reporting}": ["p(95)<500", "p(99)<1000"],
    errors: ["rate<0.005"],
  },
};

function login() {
  const res = http.post(`${BASE_URL}/api/login`,
    JSON.stringify({ username: "sarah.johnson", password: "Welcome1!" }),
    { headers: { "Content-Type": "application/json" } }
  );
  check(res, { "login 200": (r) => r.status === 200 }) || errorRate.add(1);
  return res.cookies;
}

export function authStorm() {
  const res = http.post(`${BASE_URL}/api/login`,
    JSON.stringify({ username: "sarah.johnson", password: "Welcome1!" }),
    { headers: { "Content-Type": "application/json" }, tags: { scenario: "auth" } }
  );
  check(res, { "auth ok": (r) => r.status === 200 || r.status === 429 });
  sleep(1);
}

export function browse() {
  const cookies = login();
  group("browse", () => {
    http.get(`${BASE_URL}/api/employees?page=1&limit=25`, { cookies, tags: { scenario: "browse" } });
    http.get(`${BASE_URL}/api/notifications`, { cookies, tags: { scenario: "browse" } });
  });
  sleep(1);
}

export function reporting() {
  const cookies = login();
  http.get(`${BASE_URL}/api/health`, { cookies, tags: { scenario: "reporting" } });
  sleep(2);
}
