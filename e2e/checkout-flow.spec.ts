import { test, expect, type Page } from "@playwright/test";
import { seedCatalog } from "./catalog";

test.beforeAll(() => {
  seedCatalog("create");
});

test.afterAll(() => {
  seedCatalog("remove");
});

// Opens the first product that renders an Add to Cart button (skips out-of-stock).
async function gotoFirstInStockProduct(page: Page) {
  await page.goto("/shop");
  const links = page.locator("a[href^='/product/']");
  await links.first().waitFor({ state: "visible", timeout: 10000 });
  const hrefs = await links.evaluateAll((els) =>
    els.map((el) => (el as HTMLAnchorElement).href)
  );
  for (const href of hrefs) {
    await page.goto(href);
    const addBtn = page.locator("button").filter({ hasText: /Add to Cart — RM/i });
    if ((await addBtn.count()) > 0) return;
  }
  throw new Error("No in-stock product found in /shop");
}

async function addToCart(page: Page) {
  await gotoFirstInStockProduct(page);
  const addBtn = page.locator("button").filter({ hasText: /Add to Cart — RM/i }).first();
  await addBtn.waitFor({ state: "visible", timeout: 5000 });
  await addBtn.click();
  await page.waitForTimeout(300);
}

// ---------------------------------------------------------------------------
// Direct-navigation guards (empty cart)
// ---------------------------------------------------------------------------
test("visiting /checkout/delivery with empty cart redirects to /checkout", async ({ page }) => {
  await page.goto("/checkout/delivery");
  await page.waitForURL("/checkout", { timeout: 10000 });
  await expect(page.locator("text=Basket")).toBeVisible();
});

test("visiting /checkout/payment with empty cart redirects to /checkout", async ({ page }) => {
  await page.goto("/checkout/payment");
  await page.waitForURL("/checkout", { timeout: 10000 });
  await expect(page.locator("text=Basket")).toBeVisible();
});

// ---------------------------------------------------------------------------
// Step indicator presence on all four steps
// ---------------------------------------------------------------------------
test("step indicator renders on basket step 1", async ({ page }) => {
  await addToCart(page);
  await page.goto("/checkout");
  await expect(page.getByText("Basket").first()).toBeVisible();
  await expect(page.getByText("Delivery").first()).toBeVisible();
  await expect(page.getByText("Payment").first()).toBeVisible();
  await expect(page.getByText("Done").first()).toBeVisible();
});

// ---------------------------------------------------------------------------
// Full flow navigation: Basket → Delivery → Payment (no CHIP trigger)
// ---------------------------------------------------------------------------
test("basket → delivery → payment navigation flow works", async ({ page }) => {
  await addToCart(page);
  await page.goto("/checkout");

  // Step 1: Basket — item list + subtotal + continue
  await expect(page.locator("text=Basket").first()).toBeVisible();
  await page.locator("button", { hasText: /Continue to Delivery/i }).click();
  await page.waitForURL("/checkout/delivery", { timeout: 10000 });

  // Step 2: Delivery — fill contact + choose standard, sabah/sarawak
  await page.locator("#name").fill("E2E Checkout User");
  await page.locator("#email").fill("e2e-checkout@happycamera.com");
  await page.locator("#phone").fill("0123456789");
  await page.locator("#address").fill("123 Jalan Test, 50000 Kuala Lumpur");
  // choose Sabah & Sarawak region (anchored regex matches only the region toggle,
  // excluding the enclosing Standard Shipping card whose name also contains this text)
  await page.getByRole("button", { name: /^Sabah & Sarawak\s*\(RM 30\)$/ }).click();
  await page.locator("button", { hasText: /Continue to Payment/i }).click();
  await page.waitForURL("/checkout/payment", { timeout: 10000 });

  // Step 3: Payment — read-only summary shows delivery charge RM30 + total
  await expect(page.locator("text=Payment").first()).toBeVisible();
  await expect(page.locator("text=E2E Checkout User").first()).toBeVisible();
  await expect(page.locator("text=Standard Shipping").first()).toBeVisible();
  await expect(page.locator("text=RM 30").first()).toBeVisible();

  // Back navigation preserves delivery data (sessionStorage)
  await page.locator("button", { hasText: /Back to Delivery/i }).click();
  await page.waitForURL("/checkout/delivery", { timeout: 10000 });
  await expect(page.locator("#name")).toHaveValue("E2E Checkout User");
  await expect(page.locator("#address")).toHaveValue("123 Jalan Test, 50000 Kuala Lumpur");
  await page.locator("button", { hasText: /Continue to Payment/i }).click();
  await page.waitForURL("/checkout/payment", { timeout: 10000 });

  // Validation: missing fields block navigation
  await page.locator("button", { hasText: /Back to Delivery/i }).click();
  await page.locator("#name").fill("");
  await page.locator("button", { hasText: /Continue to Payment/i }).click();
  await expect(page.locator("text=Please enter your full name.").first()).toBeVisible();
});

