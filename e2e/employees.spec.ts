import { test, expect } from "@playwright/test";

async function login(page: any) {
  await page.goto("/auth");
  await page.getByPlaceholder(/username/i).fill("sarah.johnson");
  await page.getByPlaceholder(/password/i).fill("Welcome1!");
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL((url: URL) => !url.pathname.startsWith("/auth"), { timeout: 15_000 });
}

test.describe("Employees CRUD", () => {
  test("list employees via API", async ({ request }) => {
    const login = await request.post("/api/login", {
      data: { username: "sarah.johnson", password: "Welcome1!" },
    });
    expect(login.ok()).toBe(true);

    const res = await request.get("/api/employees");
    expect(res.ok()).toBe(true);
    const data = await res.json();
    const list = Array.isArray(data) ? data : data.data;
    expect(Array.isArray(list)).toBe(true);
  });

  test("create + delete employee via API", async ({ request }) => {
    const login = await request.post("/api/login", {
      data: { username: "sarah.johnson", password: "Welcome1!" },
    });
    expect(login.ok()).toBe(true);

    const csrf = await request.get("/api/csrf-token");
    const { csrfToken } = await csrf.json();

    const create = await request.post("/api/employees", {
      headers: { "x-csrf-token": csrfToken },
      data: {
        fullName: "E2E Test User",
        email: `e2e-${Date.now()}@test.com`,
        position: "QA Engineer",
        department: "Engineering",
        status: "active",
        hireDate: new Date().toISOString(),
      },
    });
    expect([200, 201]).toContain(create.status());
    const created = await create.json();
    expect(created.id).toBeDefined();

    const del = await request.delete(`/api/employees/${created.id}`, {
      headers: { "x-csrf-token": csrfToken },
    });
    expect([200, 204]).toContain(del.status());
  });

  test("can navigate to employees page", async ({ page }) => {
    await login(page);
    await page.goto("/employees");
    await expect(page.locator("body")).toBeVisible();
  });
});
