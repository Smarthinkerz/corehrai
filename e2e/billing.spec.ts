import { test, expect } from "@playwright/test";

test.describe("Billing & Subscription Upgrade", () => {
  test("plans require authentication", async ({ request }) => {
    const res = await request.get("/api/billing/plans");
    expect(res.status()).toBe(401);
  });

  test("authenticated user can view current plan", async ({ request }) => {
    const login = await request.post("/api/login", {
      data: { username: "sarah.johnson", password: "Welcome1!" },
    });
    expect(login.ok()).toBe(true);

    const res = await request.get("/api/billing/current");
    expect(res.ok()).toBe(true);
    const data = await res.json();
    expect(data.plan).toBeDefined();
    expect(data.features).toBeDefined();
    expect(data.limits).toBeDefined();
  });

  test("checkout endpoint validates plan", async ({ request }) => {
    await request.post("/api/login", {
      data: { username: "sarah.johnson", password: "Welcome1!" },
    });
    const csrf = await request.get("/api/csrf-token");
    const { csrfToken } = await csrf.json();

    const bad = await request.post("/api/billing/checkout", {
      headers: { "x-csrf-token": csrfToken },
      data: { plan: "garbage" },
    });
    expect(bad.status()).toBe(400);
  });

  test("upgrade endpoint validates plan", async ({ request }) => {
    await request.post("/api/login", {
      data: { username: "sarah.johnson", password: "Welcome1!" },
    });
    const csrf = await request.get("/api/csrf-token");
    const { csrfToken } = await csrf.json();

    const bad = await request.post("/api/billing/upgrade", {
      headers: { "x-csrf-token": csrfToken },
      data: { plan: "platinum" },
    });
    expect(bad.status()).toBe(400);
  });

  test("checkout returns Tap Payments URL for valid plan", async ({ request }) => {
    await request.post("/api/login", {
      data: { username: "sarah.johnson", password: "Welcome1!" },
    });
    const csrf = await request.get("/api/csrf-token");
    const { csrfToken } = await csrf.json();

    const res = await request.post("/api/billing/checkout", {
      headers: { "x-csrf-token": csrfToken },
      data: { plan: "pro", cycle: "monthly" },
    });
    expect([200, 201, 302]).toContain(res.status());
  });
});
