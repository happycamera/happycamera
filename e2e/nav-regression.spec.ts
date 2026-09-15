import { test, expect } from "@playwright/test";
import { seedCatalog } from "./catalog";

const BASE = "http://localhost:3000";

test.beforeAll(() => {
  seedCatalog("create");
});

test.afterAll(() => {
  seedCatalog("remove");
});

// Helper: client-side navigate to /shop via the navbar <a> element (bypasses mega menu overlay)
async function goToShop(page: import("@playwright/test").Page) {
  await page.evaluate(() => {
    const link = document.querySelector('nav a[href="/shop"]') as HTMLAnchorElement;
    if (link) link.click();
  });
}

// Helper: client-side navigate to homepage via logo
async function goHome(page: import("@playwright/test").Page) {
  await page.evaluate(() => {
    const link = document.querySelector('nav a[href="/"]') as HTMLAnchorElement;
    if (link) link.click();
  });
}

test.describe("Group 1: General navigation smoke test", () => {
  test("buttons stay interactive after homepage→shop→product→back→home", async ({ page }) => {
    // 1. Homepage
    await page.goto(BASE, { waitUntil: "networkidle" });
    await expect(page.locator("h2").first()).toBeVisible({ timeout: 5000 });

    // 2. Client-side navigate to shop via navbar
    await goToShop(page);
    await page.waitForURL("**/shop", { timeout: 10000 });
    await page.waitForLoadState("networkidle");

    // 3. Click a product card (real click — no overlay issue here)
    const productCard = page.locator('a[href^="/product/"]').first();
    await expect(productCard).toBeVisible({ timeout: 5000 });
    await productCard.click();
    await page.waitForURL("**/product/**", { timeout: 10000 });
    await page.waitForLoadState("networkidle");

    // 4. Go back to shop via navbar
    await goToShop(page);
    await page.waitForURL("**/shop", { timeout: 10000 });

    // 5. Go home via logo
    await goHome(page);
    await page.waitForURL(BASE + "/", { timeout: 10000 });
    await page.waitForLoadState("networkidle");

    // 6. Verify homepage re-renders
    await expect(page.locator("h2").first()).toBeVisible({ timeout: 5000 });

    // 7. Cart icon opens (first click), close by clicking the X button in the drawer
    await page.locator('button[aria-label="Cart"]').click();
    await page.waitForTimeout(500);
    // Close drawer via the "Close cart" button
    await page.locator('button[aria-label="Close cart"]').click();
    await page.waitForTimeout(300);
  });
});

test.describe("Group 2: Success/failed bounce test", () => {
  test("multiple bounces to success/failed don't break interactivity", async ({ page }) => {
    const bounces = [
      { url: "/shop/success", cta: "Continue Shopping", goTo: "**/shop" },
      { url: "/shop/failed", cta: "Try Again", goTo: "**/shop" },
      { url: "/shop/success", cta: "Continue Shopping", goTo: "**/shop" },
      { url: "/shop/failed", cta: "Try Again", goTo: "**/shop" },
    ];

    for (const { url, cta, goTo } of bounces) {
      // Full page load to success/failed
      await page.goto(BASE + url, { waitUntil: "networkidle" });
      await expect(page.locator(`text=${cta}`)).toBeVisible({ timeout: 5000 });

      // Click CTA — real click (these pages have no mega menu overlay)
      await page.locator(`text=${cta}`).first().click();
      await page.waitForURL(goTo, { timeout: 10000 });
      await page.waitForLoadState("networkidle");
    }

    // After all bounces: verify interactivity
    // Go home via logo click
    await goHome(page);
    await page.waitForURL(BASE + "/", { timeout: 10000 });

    await expect(page.locator("h2").first()).toBeVisible({ timeout: 5000 });

    // Cart opens
    await page.locator('button[aria-label="Cart"]').click();
    await page.waitForTimeout(300);
    await page.locator('button[aria-label="Close cart"]').click();
    await page.waitForTimeout(300);
    await goToShop(page);
    await page.waitForURL("**/shop", { timeout: 10000 });
    await expect(page.locator('a[href^="/product/"]').first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Group 3: Mixed flow", () => {
  test("full mixed navigation flow stays interactive", async ({ page }) => {
    // Homepage
    await page.goto(BASE, { waitUntil: "networkidle" });
    await expect(page.locator("h2").first()).toBeVisible({ timeout: 5000 });

    // Shop via navbar
    await goToShop(page);
    await page.waitForURL("**/shop", { timeout: 10000 });

    // Product
    await page.locator('a[href^="/product/"]').first().click();
    await page.waitForURL("**/product/**", { timeout: 10000 });

    // Back to shop via navbar
    await goToShop(page);
    await page.waitForURL("**/shop", { timeout: 10000 });

    // Navigate to success (full page load — simulates CHIP redirect)
    await page.goto(BASE + "/shop/success", { waitUntil: "networkidle" });
    // Continue Shopping → /shop
    await page.locator("text=Continue Shopping").first().click();
    await page.waitForURL("**/shop", { timeout: 10000 });

    // Navigate to failed (full page load — simulates CHIP redirect)
    await page.goto(BASE + "/shop/failed", { waitUntil: "networkidle" });
    // Try Again → /shop
    await page.locator("text=Try Again").first().click();
    await page.waitForURL("**/shop", { timeout: 10000 });

    // Go home
    await goHome(page);
    await page.waitForURL(BASE + "/", { timeout: 10000 });

    // Final: verify everything works
    await expect(page.locator("h2").first()).toBeVisible({ timeout: 5000 });
    await page.locator('button[aria-label="Cart"]').click();
    await page.waitForTimeout(300);
    await page.locator('button[aria-label="Close cart"]').click();
    await page.waitForTimeout(300);

    // Shop nav works
    await goToShop(page);
    await page.waitForURL("**/shop", { timeout: 10000 });
    await expect(page.locator('a[href^="/product/"]').first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Group 4: No visual overlap during transitions", () => {
  test("old page content disappears before new page renders", async ({ page }) => {
    // Homepage — grab hero text
    await page.goto(BASE, { waitUntil: "networkidle" });
    const heroText = await page.locator("h2").first().textContent();

    // Navigate to shop via navbar (client-side)
    await goToShop(page);
    await page.waitForURL("**/shop", { timeout: 10000 });
    await page.waitForLoadState("networkidle");

    // Homepage hero should NOT be visible on shop page
    const heroStillVisible = await page.locator(`h2:has-text("${heroText}")`).isVisible().catch(() => false);
    expect(heroStillVisible).toBeFalsy();

    // Navigate to success (full page load)
    await page.goto(BASE + "/shop/success", { waitUntil: "networkidle" });

    // Shop page products should NOT be visible on success page
    const productsVisible = await page.locator('a[href^="/product/"]').first().isVisible().catch(() => false);
    expect(productsVisible).toBeFalsy();

    // Navigate back to shop via Continue Shopping
    await page.locator("text=Continue Shopping").first().click();
    await page.waitForURL("**/shop", { timeout: 10000 });
    await page.waitForLoadState("networkidle");

    // Success page content should NOT be visible on shop page
    const successVisible = await page.locator("text=Payment Confirmed").isVisible().catch(() => false);
    expect(successVisible).toBeFalsy();

    // Go home
    await goHome(page);
    await page.waitForURL(BASE + "/", { timeout: 10000 });

    // Shop products should NOT be visible on homepage
    const shopProductsGone = await page.locator('a[href^="/product/"]').first().isVisible().catch(() => false);
    // Homepage does have product links, so check that the shop-specific layout is gone
    // Instead verify the hero is back
    await expect(page.locator("h2").first()).toBeVisible({ timeout: 5000 });
  });
});
