import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("login → dashboard flow", async ({ page }) => {
    await page.goto("/auth");
    await expect(page.getByText(/Welcome Back|Login/i).first()).toBeVisible();

    await page.getByPlaceholder(/username/i).fill("sarah.johnson");
    await page.getByPlaceholder(/password/i).fill("Welcome1!");
    await page.getByRole("button", { name: /sign in/i }).click();

    await page.waitForURL((url) => !url.pathname.startsWith("/auth"), { timeout: 15_000 });
    await expect(page.locator("body")).toBeVisible();
  });

  test("invalid credentials show error", async ({ page }) => {
    await page.goto("/auth");
    await page.getByPlaceholder(/username/i).fill("sarah.johnson");
    await page.getByPlaceholder(/password/i).fill("wrong-password");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page.getByText(/invalid|incorrect|failed/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test("unauthenticated user redirected from /dashboard", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/dashboard");
    await page.waitForURL(/\/auth/, { timeout: 10_000 });
    await expect(page).toHaveURL(/\/auth/);
  });
});
