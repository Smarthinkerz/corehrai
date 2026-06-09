import { describe, it, expect, beforeAll } from "vitest";

const BASE_URL = `http://localhost:${process.env.PORT || 5000}`;

async function fetchApi(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  return { status: res.status, data: await res.json().catch(() => null), headers: res.headers };
}

describe("API Health & Public Endpoints", () => {
  it("GET /api/health should return ok", async () => {
    const { status, data } = await fetchApi("/api/health");
    expect(status).toBe(200);
    expect(data.status).toBe("ok");
    expect(data.uptime).toBeGreaterThan(0);
    expect(data.version).toBe("1.0.0");
    expect(data.database).toBe("connected");
    expect(data.services).toBeDefined();
  });

  it("GET /api/csrf-token should return token", async () => {
    const { status, data } = await fetchApi("/api/csrf-token");
    expect(status).toBe(200);
    expect(data.csrfToken).toBeDefined();
    expect(typeof data.csrfToken).toBe("string");
    expect(data.csrfToken.length).toBeGreaterThan(0);
  });

  it("GET /api/legal/terms should return terms", async () => {
    const { status, data } = await fetchApi("/api/legal/terms");
    expect(status).toBe(200);
    expect(data).toBeDefined();
  });

  it("GET /api/legal/privacy should return privacy policy", async () => {
    const { status, data } = await fetchApi("/api/legal/privacy");
    expect(status).toBe(200);
    expect(data).toBeDefined();
  });

  it("GET /api/legal/dpa should return DPA", async () => {
    const { status, data } = await fetchApi("/api/legal/dpa");
    expect(status).toBe(200);
    expect(data).toBeDefined();
  });

  it("GET /api/swagger.json should return OpenAPI spec", async () => {
    const { status, data } = await fetchApi("/api/swagger.json");
    expect(status).toBe(200);
    expect(data.openapi).toBe("3.0.0");
    expect(data.info.title).toBe("AI HR Agent API");
    expect(data.paths).toBeDefined();
    expect(Object.keys(data.paths).length).toBeGreaterThan(50);
  });

  it("GET /api/billing/plans requires authentication", async () => {
    const { status } = await fetchApi("/api/billing/plans");
    expect(status).toBe(401);
  });
});

describe("Security Headers", () => {
  it("should include security headers in responses", async () => {
    const { headers } = await fetchApi("/api/health");
    expect(headers.get("x-content-type-options")).toBe("nosniff");
    expect(headers.get("x-frame-options")).toBe("SAMEORIGIN");
    expect(headers.get("x-xss-protection")).toBe("0");
    expect(headers.get("referrer-policy")).toBe("no-referrer");
    expect(headers.get("strict-transport-security")).toContain("max-age");
    expect(headers.get("content-security-policy")).toBeTruthy();
  });

  it("should include rate limit headers", async () => {
    const { headers } = await fetchApi("/api/health");
    expect(headers.get("ratelimit-limit")).toBeTruthy();
    expect(headers.get("ratelimit-remaining")).toBeTruthy();
  });
});

describe("API Auth Guard", () => {
  it("should reject unauthenticated requests to /api/employees", async () => {
    const { status } = await fetchApi("/api/employees");
    expect(status).toBe(401);
  });

  it("should reject unauthenticated requests to /api/users", async () => {
    const { status } = await fetchApi("/api/users");
    expect(status).toBe(401);
  });

  it("should reject unauthenticated requests to /api/departments", async () => {
    const { status } = await fetchApi("/api/departments");
    expect(status).toBe(401);
  });

  it("should reject unauthenticated requests to /api/candidates", async () => {
    const { status } = await fetchApi("/api/candidates");
    expect(status).toBe(401);
  });

  it("should reject unauthenticated requests to /api/2fa/status", async () => {
    const { status } = await fetchApi("/api/2fa/status");
    expect(status).toBe(401);
  });

  it("should reject unauthenticated requests to /api/gdpr/export", async () => {
    const { status } = await fetchApi("/api/gdpr/export");
    expect(status).toBe(401);
  });

  it("should reject unauthenticated POST to /api/employees", async () => {
    const { status } = await fetchApi("/api/employees", {
      method: "POST",
      body: JSON.stringify({ fullName: "Test" }),
    });
    expect(status).toBe(401);
  });

  it("should reject unauthenticated requests to /api/billing/current", async () => {
    const { status } = await fetchApi("/api/billing/current");
    expect(status).toBe(401);
  });
});

describe("API Auth Flow", () => {
  let sessionCookie = "";

  it("POST /api/login with valid credentials should succeed", async () => {
    const res = await fetch(`${BASE_URL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "sarah.johnson", password: "Welcome1!" }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.username).toBe("sarah.johnson");
    expect(data.password).toBeUndefined();
    expect(data.twoFactorSecret).toBeUndefined();
    sessionCookie = res.headers.get("set-cookie") || "";
  });

  it("POST /api/login with invalid credentials should fail", async () => {
    const { status, data } = await fetchApi("/api/login", {
      method: "POST",
      body: JSON.stringify({ username: "sarah.johnson", password: "wrongpassword" }),
    });
    expect(status).toBe(401);
    expect(data.error).toBeDefined();
  });

  it("POST /api/login with missing fields should fail", async () => {
    const { status } = await fetchApi("/api/login", {
      method: "POST",
      body: JSON.stringify({}),
    });
    expect([400, 401]).toContain(status);
  });

  it("GET /api/user should return user when authenticated", async () => {
    if (!sessionCookie) return;
    const res = await fetch(`${BASE_URL}/api/user`, {
      headers: { Cookie: sessionCookie },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.username).toBe("sarah.johnson");
    expect(data.password).toBeUndefined();
  });

  it("Authenticated requests to protected routes should work", async () => {
    if (!sessionCookie) return;
    const res = await fetch(`${BASE_URL}/api/employees`, {
      headers: { Cookie: sessionCookie },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.data || data)).toBe(true);
  });

  it("GET /api/departments should return departments", async () => {
    if (!sessionCookie) return;
    const res = await fetch(`${BASE_URL}/api/departments`, {
      headers: { Cookie: sessionCookie },
    });
    expect(res.status).toBe(200);
  });

  it("GET /api/billing/current should return plan info when authenticated", async () => {
    if (!sessionCookie) return;
    const res = await fetch(`${BASE_URL}/api/billing/current`, {
      headers: { Cookie: sessionCookie },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.plan).toBeDefined();
    expect(data.features).toBeDefined();
    expect(data.limits).toBeDefined();
  });

  it("Paginated endpoints should return pagination metadata", async () => {
    if (!sessionCookie) return;
    const res = await fetch(`${BASE_URL}/api/employees?page=1&limit=5`, {
      headers: { Cookie: sessionCookie },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.data).toBeDefined();
    expect(data.pagination).toBeDefined();
    expect(data.pagination.page).toBe(1);
    expect(data.pagination.limit).toBe(5);
    expect(data.pagination.total).toBeDefined();
    expect(data.pagination.totalPages).toBeDefined();
    expect(typeof data.pagination.hasMore).toBe("boolean");
  });

  it("Non-paginated endpoints should return flat arrays", async () => {
    if (!sessionCookie) return;
    const res = await fetch(`${BASE_URL}/api/employees`, {
      headers: { Cookie: sessionCookie },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });
});

describe("API Validation", () => {
  let sessionCookie = "";

  beforeAll(async () => {
    const res = await fetch(`${BASE_URL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "sarah.johnson", password: "Welcome1!" }),
    });
    sessionCookie = res.headers.get("set-cookie") || "";
  });

  it("POST /api/billing/checkout should reject invalid plan", async () => {
    if (!sessionCookie) return;
    const res = await fetch(`${BASE_URL}/api/billing/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: sessionCookie },
      body: JSON.stringify({ plan: "invalid_plan" }),
    });
    expect(res.status).toBe(400);
  });

  it("POST /api/billing/upgrade should reject invalid plan", async () => {
    if (!sessionCookie) return;
    const res = await fetch(`${BASE_URL}/api/billing/upgrade`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: sessionCookie },
      body: JSON.stringify({ plan: "gold" }),
    });
    expect(res.status).toBe(400);
  });

  it("POST /api/self-service/leave-requests should reject invalid data", async () => {
    if (!sessionCookie) return;
    const res = await fetch(`${BASE_URL}/api/self-service/leave-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: sessionCookie },
      body: JSON.stringify({ type: "invalid_type" }),
    });
    expect(res.status).toBe(400);
  });
});
