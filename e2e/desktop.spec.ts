import { test, expect } from "@playwright/test";

test.describe("WIT ERP OS shell", () => {
  test("unlocks the desktop with the demo password", async ({ page }) => {
    await page.goto("/");

    const password = page.locator('input[type="password"]');
    await expect(password).toBeVisible({ timeout: 60_000 });

    await password.fill("demo");
    await password.press("Enter");

    // The desktop shell is up once the always-on assistant launcher renders.
    await expect(
      page.getByRole("button", { name: "Open Reddie assistant" }),
    ).toBeVisible({ timeout: 60_000 });

    // Top menu bar is present too.
    await expect(page.getByText("WIT ERP OS").first()).toBeVisible();
  });

  test("opens Spotlight search with the top-bar control", async ({ page }) => {
    await page.goto("/");
    const password = page.locator('input[type="password"]');
    await expect(password).toBeVisible({ timeout: 60_000 });
    await password.fill("demo");
    await password.press("Enter");
    await expect(
      page.getByRole("button", { name: "Open Reddie assistant" }),
    ).toBeVisible({ timeout: 60_000 });

    await page.getByRole("button", { name: /Search anywhere/i }).click();
    await expect(
      page.getByPlaceholder(/Search projects, clients/i),
    ).toBeVisible();
  });
});
