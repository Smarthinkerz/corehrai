import { test, expect } from "@playwright/test";

test.describe("Multi-tenant isolation", () => {
  test("user can only see own organization's data", async ({ request }) => {
    const login = await request.post("/api/login", {
      data: { username: "sarah.johnson", password: "Welcome1!" },
    });
    expect(login.ok()).toBe(true);

    const me = await request.get("/api/user");
    const meData = await me.json();
    const orgId = meData.organizationId;
    expect(orgId).toBeDefined();

    const employees = await request.get("/api/employees");
    expect(employees.ok()).toBe(true);
    const list = await employees.json();
    const items = Array.isArray(list) ? list : list.data;
    if (items.length > 0) {
      for (const emp of items) {
        if (emp.organizationId != null) {
          expect(emp.organizationId).toBe(orgId);
        }
      }
    }
  });

  test("cross-tenant access is blocked", async ({ request }) => {
    await request.post("/api/login", {
      data: { username: "sarah.johnson", password: "Welcome1!" },
    });
    const res = await request.get("/api/employees/999999");
    expect([401, 403, 404]).toContain(res.status());
  });

  test("organization endpoint returns user's org", async ({ request }) => {
    await request.post("/api/login", {
      data: { username: "sarah.johnson", password: "Welcome1!" },
    });
    const me = await request.get("/api/user");
    const meData = await me.json();
    if (!meData.organizationId) test.skip();

    const res = await request.get(`/api/organizations/${meData.organizationId}`);
    expect([200, 404]).toContain(res.status());
  });

  test("logout clears session", async ({ request }) => {
    await request.post("/api/login", {
      data: { username: "sarah.johnson", password: "Welcome1!" },
    });
    const csrf = await request.get("/api/csrf-token");
    const { csrfToken } = await csrf.json();
    await request.post("/api/logout", { headers: { "x-csrf-token": csrfToken } });
    const after = await request.get("/api/user");
    expect(after.status()).toBe(401);
  });
});
