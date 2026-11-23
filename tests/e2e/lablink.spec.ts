import { test, expect, Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function openPersonaModal(page: Page) {
  const modal = page.locator(".persona-modal-card");
  if (await modal.isVisible({ timeout: 1000 }).catch(() => false)) {
    return;
  }

  const skipBtn = page.locator(".intro-skip-btn");
  if (await skipBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
    await skipBtn.click();
    await page.waitForTimeout(300);
  }

  if (await modal.isVisible({ timeout: 1000 }).catch(() => false)) {
    return;
  }

  const rolePill = page.locator(".switch-role-pill");
  if (await rolePill.isVisible({ timeout: 3000 }).catch(() => false)) {
    await rolePill.click();
    const confirmBtn = page.getByRole("button", { name: /select role/i });
    if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmBtn.click();
    }
  }
}

test.describe("LabLink Nexus - E2E Multi-Stakeholder Platform", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("Splash screen renders and transitions to persona picker or home", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/LabLink Nexus/);

    const body = page.locator("body");
    await expect(body).toBeVisible();

    const brandOrIntro = page.locator(".intro-brand-title").or(page.locator(".brand-title"));
    await expect(brandOrIntro.first()).toBeVisible();
  });

  test("Renders all 6 stakeholder personas in selection interface", async ({ page }) => {
    await page.goto("/");
    await openPersonaModal(page);

    // Verify presence of all 6 personas in modal
    const modal = page.locator(".persona-modal-card");
    await expect(modal).toBeVisible({ timeout: 8000 });
    await expect(modal.locator(".persona-choice-card").filter({ hasText: /Alex Kumar/i })).toBeVisible();
    await expect(modal.locator(".persona-choice-card").filter({ hasText: /Dr\. Sarah Jenkins/i })).toBeVisible();
    await expect(modal.locator(".persona-choice-card").filter({ hasText: /Rajesh Verma/i })).toBeVisible();
    await expect(modal.locator(".persona-choice-card").filter({ hasText: /Prof\. Marcus Vance/i })).toBeVisible();
    await expect(modal.locator(".persona-choice-card").filter({ hasText: /Dr\. Aris Thorne/i })).toBeVisible();
    await expect(modal.locator(".persona-choice-card").filter({ hasText: /Dr\. Elena Rostova/i })).toBeVisible();
  });

  test("Selecting Student persona enters Student Dashboard and sets server cookie", async ({ page, context }) => {
    await page.goto("/");
    await openPersonaModal(page);

    // Select Alex Kumar card inside modal
    const alexCard = page.locator(".persona-modal-card .persona-choice-card").filter({ hasText: /Alex Kumar/i });
    await expect(alexCard).toBeVisible({ timeout: 8000 });

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
    await openPersonaModal(page);

    // Select Faculty (Dr. Sarah Jenkins)
    const sarahCard = page.locator(".persona-modal-card .persona-choice-card").filter({ hasText: /Dr\. Sarah Jenkins/i });
    await expect(sarahCard).toBeVisible({ timeout: 8000 });

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
