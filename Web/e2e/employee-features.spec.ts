import { test, expect } from "@playwright/test";

/**
 * Smoke tests for the employee management features.
 *
 * These tests verify the UI structure and form elements exist.
 * Full e2e flows require authenticated sessions — use `storageState`
 * from a login fixture for production CI.
 */

test.describe("Login page", () => {
  test("renders login form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });
});

test.describe("Public pages", () => {
  test("landing page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Elitebase/i);
  });

  test("employee registration page loads", async ({ page }) => {
    await page.goto("/register/employee");
    await expect(page.locator("h1, h2")).toContainText(/employee|register/i);
  });
});

test.describe("Employee features (auth required — smoke)", () => {
  test.skip(
    !process.env.PLAYWRIGHT_AUTH_COOKIE,
    "Skipped: set PLAYWRIGHT_AUTH_COOKIE for authenticated tests"
  );

  test.beforeEach(async ({ page }) => {
    if (process.env.PLAYWRIGHT_AUTH_COOKIE) {
      const baseUrl = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
      const url = new URL(baseUrl);
      await page.context().addCookies([
        {
          name: "better-auth.session_token",
          value: process.env.PLAYWRIGHT_AUTH_COOKIE!,
          domain: url.hostname,
          path: "/",
        },
      ]);
    }
  });

  test("employees roster page has expected columns", async ({ page }) => {
    await page.goto("/employees");
    await page.waitForSelector("table", { timeout: 10000 });

    const headers = page.locator("table thead th");
    const headerTexts = await headers.allTextContents();
    const joined = headerTexts.join(" ").toLowerCase();

    expect(joined).toContain("employee");
    expect(joined).toContain("schedule");
    expect(joined).toContain("salary");
    expect(joined).toContain("today");
    expect(joined).toContain("pin");
  });

  test("add employee drawer has schedule and bonus fields", async ({ page }) => {
    await page.goto("/employees");
    await page.click("text=Add employee");
    await page.waitForSelector('[name="fullName"]', { timeout: 5000 });

    await expect(page.locator('[name="scheduleStartTime"]')).toBeVisible();
    await expect(page.locator('[name="scheduleEndTime"]')).toBeVisible();
    await expect(page.locator('[name="bonusAmount"]')).toBeVisible();
    await expect(page.locator('[name="bonusNote"]')).toBeVisible();
    await expect(page.locator('[name="payType"]')).toBeVisible();

    const dayButtons = page.locator('button:has-text("Mon"), button:has-text("Tue")');
    await expect(dayButtons.first()).toBeVisible();
  });

  test("add employee with schedule and bonus", async ({ page }) => {
    await page.goto("/employees");
    await page.click("text=Add employee");
    await page.waitForSelector('[name="fullName"]', { timeout: 5000 });

    await page.fill('[name="fullName"]', `Test Employee ${Date.now()}`);
    await page.fill('[name="scheduleStartTime"]', "08:00");
    await page.fill('[name="scheduleEndTime"]', "16:00");
    await page.fill('[name="bonusAmount"]', "500");
    await page.fill('[name="bonusNote"]', "Signing bonus");

    await page.click('button:has-text("Sun")');

    await page.click('button:has-text("Add employee")');

    await page.waitForSelector('text=was added', { timeout: 10000 });
    await expect(page.locator("text=was added")).toBeVisible();
  });

  test("time-off page has paid/unpaid leave options", async ({ page }) => {
    await page.goto("/team/time-off");
    await page.waitForSelector('[id="time-off-type"]', { timeout: 10000 });

    const options = page.locator('#time-off-type option');
    const optionTexts = await options.allTextContents();
    const joined = optionTexts.join(" ").toLowerCase();

    expect(joined).toContain("paid leave");
    expect(joined).toContain("unpaid leave");
  });

  test("employee profile shows schedule and bonus fields", async ({ page }) => {
    await page.goto("/employees");
    await page.waitForSelector("table", { timeout: 10000 });

    const firstEditLink = page.locator('a:has-text("Edit")').first();
    if (await firstEditLink.isVisible()) {
      await firstEditLink.click();
      await page.waitForSelector('text=Job Details', { timeout: 10000 });

      const content = await page.textContent("body");
      expect(content).toContain("Schedule");
      expect(content).toContain("Shift start");
    }
  });
});
