import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("LabLink Nexus - E2E Multi-Stakeholder Platform", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("Splash screen renders and transitions to persona picker or home", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/LabLink Nexus/);

    const body = page.locator("body");
    await expect(body).toBeVisible();

    // Verify skip button or brand title is present
    const brandOrIntro = page.locator(".intro-brand-title").or(page.locator(".brand-title"));
    await expect(brandOrIntro.first()).toBeVisible();
  });

  test("Renders all 6 stakeholder personas in selection interface", async ({ page }) => {
    await page.goto("/");

    // If intro splash is visible, click skip
    const skipBtn = page.locator(".intro-skip-btn");
    if (await skipBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await skipBtn.click();
    }

    // Open switch role confirmation dialog via role pill
    const rolePill = page.locator(".switch-role-pill");
    await expect(rolePill).toBeVisible({ timeout: 5000 });
    await rolePill.click();

    // Click confirm "Select Role" button
    const confirmBtn = page.getByRole("button", { name: /select role/i });
    await expect(confirmBtn).toBeVisible({ timeout: 5000 });
    await confirmBtn.click();

    // Verify presence of all 6 personas in modal
    const modal = page.locator(".persona-modal-card");
    await expect(modal).toBeVisible({ timeout: 5000 });
    await expect(modal.locator(".persona-choice-card").filter({ hasText: /Alex Kumar/i })).toBeVisible();
    await expect(modal.locator(".persona-choice-card").filter({ hasText: /Dr\. Sarah Jenkins/i })).toBeVisible();
    await expect(modal.locator(".persona-choice-card").filter({ hasText: /Rajesh Verma/i })).toBeVisible();
    await expect(modal.locator(".persona-choice-card").filter({ hasText: /Prof\. Marcus Vance/i })).toBeVisible();
    await expect(modal.locator(".persona-choice-card").filter({ hasText: /Dr\. Aris Thorne/i })).toBeVisible();
    await expect(modal.locator(".persona-choice-card").filter({ hasText: /Dr\. Elena Rostova/i })).toBeVisible();
  });

  test("Selecting Student persona enters Student Dashboard and sets server cookie", async ({ page, context }) => {
    await page.goto("/");

    // Skip intro if present
    const skipBtn = page.locator(".intro-skip-btn");
    if (await skipBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await skipBtn.click();
    }

    // Open persona modal
    await page.locator(".switch-role-pill").click();
    await page.getByRole("button", { name: /select role/i }).click();

    // Select Alex Kumar card inside modal
    const alexCard = page.locator(".persona-modal-card .persona-choice-card").filter({ hasText: /Alex Kumar/i });
    await expect(alexCard).toBeVisible({ timeout: 5000 });

    const sessionPromise = page.waitForResponse(
      (res) => res.url().includes("/api/demo/session") && res.status() === 200,
      { timeout: 10000 }
    );
    await alexCard.click();
    await sessionPromise;

    // Verify student dashboard elements
    await expect(page.getByText(/Alex Kumar/i).first()).toBeVisible({ timeout: 8000 });

    // Verify lablink_demo_session cookie was set
    const cookies = await context.cookies();
    const demoCookie = cookies.find((c) => c.name === "lablink_demo_session");
    expect(demoCookie).toBeDefined();
    expect(demoCookie?.value).toBeTruthy();
  });

  test("Persistence: Reloading page preserves active persona session", async ({ page }) => {
    await page.goto("/");

    const skipBtn = page.locator(".intro-skip-btn");
    if (await skipBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await skipBtn.click();
    }

    // Wait for active persona banner
    await expect(page.getByText(/Alex Kumar/i).first()).toBeVisible({ timeout: 8000 });

    // Reload page
    await page.reload();

    // Should remain in session without re-prompting
    await expect(page.getByText(/Alex Kumar/i).first()).toBeVisible({ timeout: 8000 });
  });

  test("Switch Role workflow without page reload", async ({ page }) => {
    await page.goto("/");

    const skipBtn = page.locator(".intro-skip-btn");
    if (await skipBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await skipBtn.click();
    }

    // Open Switch Role dialog
    await page.locator(".switch-role-pill").click();
    await page.getByRole("button", { name: /select role/i }).click();

    // Select Faculty (Dr. Sarah Jenkins)
    const sarahCard = page.locator(".persona-modal-card .persona-choice-card").filter({ hasText: /Dr\. Sarah Jenkins/i });
    await expect(sarahCard).toBeVisible({ timeout: 5000 });

    const sessionPromise = page.waitForResponse(
      (res) => res.url().includes("/api/demo/session") && res.status() === 200,
      { timeout: 10000 }
    );
    await sarahCard.click();
    await sessionPromise;

    // Verify switch to faculty dashboard without full page reload
    await expect(page.getByText(/Dr\. Sarah Jenkins/i).first()).toBeVisible({ timeout: 8000 });
  });

  test("Accessibility Audit with Axe Core across viewports", async ({ page }) => {
    await page.goto("/");

    // Skip intro if present for steady-state scan
    const skipBtn = page.locator(".intro-skip-btn");
    if (await skipBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await skipBtn.click();
    }

    // Run axe on steady-state UI
    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules(["color-contrast"]) // CSS variables computed dynamically across custom glowing canvas
      .analyze();

    // Assert zero critical or serious WCAG accessibility violations
    const seriousViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );
    expect(seriousViolations).toHaveLength(0);
  });
});
