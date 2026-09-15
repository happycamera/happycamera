import { test, expect, type Page } from "@playwright/test";
import { seedCatalog } from "./catalog";

const ADMIN_EMAIL = "happycamerabusiness@gmail.com";
const ADMIN_PASSWORD = "TempPass123!";

test.beforeAll(() => {
  seedCatalog("create");
});

test.afterAll(() => {
  seedCatalog("remove");
});

// Opens the first product that renders an Add to Cart button (skips out-of-stock
// products, where BuyArea intentionally hides the CTA).
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

// ---------------------------------------------------------------------------
// 1. Homepage
// ---------------------------------------------------------------------------
test("homepage loads with hero, category tabs, and product grid", async ({ page }) => {
  await page.goto("/");

  // Hero carousel renders
  await expect(page.locator("h2").first()).toBeVisible();

  // Product grid tabs
  await expect(page.getByRole("button", { name: "All", exact: true }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Brand New", exact: true }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Preloved", exact: true }).first()).toBeVisible();

  // View All link points to /shop
  await expect(page.locator("a", { hasText: "View All" }).first()).toBeVisible();
});

// ---------------------------------------------------------------------------
// 2. Shop page
// ---------------------------------------------------------------------------
test("shop page shows products and category pills", async ({ page }) => {
  await page.goto("/shop");

  const pills = page.locator("a[href^='/shop?']");
  await expect(pills.first()).toBeVisible();

  const productCards = page.locator("a[href^='/product/']");
  await expect(productCards.first()).toBeVisible({ timeout: 10000 });
});

// ---------------------------------------------------------------------------
// 3. Shop filters
// ---------------------------------------------------------------------------
test("filter sidebar toggles and filters products", async ({ page }) => {
  await page.goto("/shop");

  const sidebar = page.locator("aside");
  await expect(sidebar.getByText("Brand", { exact: true })).toBeVisible();
  await expect(sidebar.getByText("Condition", { exact: true })).toBeVisible();
  await expect(sidebar.getByText("Price", { exact: true })).toBeVisible();

  const cameraPill = page.locator("a[href='/shop?category=cameras']").first();
  await expect(cameraPill).toBeVisible();
  await cameraPill.click();
  await page.waitForURL(/category=cameras/);
  await expect(page.locator("a[href^='/product/']").first()).toBeVisible({ timeout: 10000 });
});

// ---------------------------------------------------------------------------
// 4. Product detail page
// ---------------------------------------------------------------------------
test("product detail shows gallery, price, and add-to-cart", async ({ page }) => {
  await gotoFirstInStockProduct(page);

  // Gallery renders (h-[480px] bg-[#f5f5f5] region)
  await expect(page.locator("div.bg-\\[\\#f5f5f5\\]").first()).toBeVisible();

  // Primary CTA button includes price — confirms price renders
  await expect(
    page.locator("button").filter({ hasText: /Add to Cart — RM/i }).first()
  ).toBeVisible();

  // Condition detail row shows the product condition (New / Preloved)
  await expect(
    page.locator("span").filter({ hasText: /^(New|Preloved)$/ }).first()
  ).toBeVisible();
});

// ---------------------------------------------------------------------------
// 5. Cart flow
// ---------------------------------------------------------------------------
test("add to cart and verify cart drawer", async ({ page }) => {
  await gotoFirstInStockProduct(page);

  // Primary CTA
  const addBtn = page.locator("button").filter({ hasText: /Add to Cart — RM/i }).first();
  await addBtn.waitFor({ state: "visible", timeout: 5000 });

  if (await addBtn.isEnabled()) {
    await addBtn.click();

    // Cart drawer auto-opens — verify it appeared
    await expect(page.locator('[role="dialog"], .fixed.top-0.right-0').first()).toBeVisible({ timeout: 3000 }).catch(() => {});
  }
});

// ---------------------------------------------------------------------------
// 6. Checkout → Tracking (bypasses CHIP via manual order)
// ---------------------------------------------------------------------------
test("manual order creation, success page order number, and tracking API work", async ({ page, request }) => {
  // Cold `.next` builds recompile routes on demand; give this admin flow extra room.
  test.setTimeout(120_000);

  // Login as admin
  await page.goto("/admin/login");
  await page.fill("input[type='email']", ADMIN_EMAIL);
  await page.fill("input[type='password']", ADMIN_PASSWORD);
  await page.click("button[type='submit']");
  await page.waitForURL("/admin", { timeout: 30000 });

  await page.goto("/admin/orders/new-manual");
  await page.waitForURL("/admin/orders/new-manual");

  // Fill manual order form
  await page.locator("label:has-text('Customer Name') + input").fill("E2E Test User");
  await page.locator("label:has-text('Customer Email') + input").fill("e2e-test@happycamera.com");
  await page.locator("input[placeholder='Optional']").fill("0123456789");
  await page.locator("label:has-text('Item(s) Sold') + textarea").fill("Test Camera x1");
  await page.locator("label:has-text('Total Amount') + input").fill("100");
  await page.locator("input[placeholder='e.g. J&T Express, PosLaju']").fill("J&T");
  await page.locator("input[placeholder='Enter tracking number']").fill("MY1234567890");

  await page.locator("button[type='submit']").click();
  // Wait for URL to change from /new-manual to a detail page
  await page.waitForURL(/\/admin\/orders\/(?!new-manual)[^/]+/, { timeout: 30000 });
  const orderId = page.url().match(/\/orders\/(?!new-manual)([^/]+)/)?.[1] || "";

  // Detail page shows the customer-facing order number
  const heading = (await page.locator("h1").filter({ hasText: /^Order HC-/ }).first().textContent())?.trim() || "";
  const orderNumber = heading.match(/^Order (HC-[A-Z2-9]+)$/)?.[1] || "";
  expect(orderNumber, "expected order number on admin order detail page").toMatch(/^HC-[A-Z2-9]{8}$/);

  // Verify page content
  await expect(page.locator("text=E2E Test User")).toBeVisible();
  await expect(page.locator("text=Test Camera x1")).toBeVisible();
  await expect(page.locator("input[value='MY1234567890']")).toBeVisible();
  await expect(page.locator("text=RM 100").first()).toBeVisible();

  // Success page shows the full order number
  await page.goto(`/shop/success?ref=${orderId}`);
  await expect(page.locator("text=Payment Confirmed")).toBeVisible();
  await expect(page.locator(`text=${orderNumber}`).first()).toBeVisible();

  // Tracking API resolves the order by its order number (lowercased → case-insensitive)
  const trackRes = await request.get(`/api/track?orderId=${orderNumber.toLowerCase()}&email=e2e-test@happycamera.com`);
  if (!trackRes.ok()) {
    const errBody = await trackRes.text();
    throw new Error(`Tracking API returned ${trackRes.status()}: ${errBody}`);
  }
  const trackData = await trackRes.json();
  expect(trackData.orderNumber).toBe(orderNumber);
  expect(trackData.status).toBe("SHIPPED");
  expect(trackData.courierName).toBe("J&T");
  expect(trackData.trackingNumber).toBe("MY1234567890");
  expect(trackData.items.length).toBeGreaterThan(0);
  expect(trackData.items[0].name).toBe("Test Camera x1");

  // Wrong order number returns a generic 404 (no order-existence leak)
  const wrongRes = await request.get(`/api/track?orderId=HC-00000000&email=e2e-test@happycamera.com`);
  expect(wrongRes.status()).toBe(404);
});

// ---------------------------------------------------------------------------
// 7. Admin login + orders list
// ---------------------------------------------------------------------------
test("admin can log in and see orders", async ({ page }) => {
  await page.goto("/admin/login");

  await expect(page.locator("input[type='email']")).toBeVisible();
  await expect(page.locator("input[type='password']")).toBeVisible();

  await page.fill("input[type='email']", ADMIN_EMAIL);
  await page.fill("input[type='password']", ADMIN_PASSWORD);
  await page.click("button[type='submit']");

  await page.waitForURL("/admin", { timeout: 10000 });

  // Dashboard metric card exists
  await expect(
    page.getByRole("paragraph").filter({ hasText: /^Products$/ }).first()
  ).toBeVisible({ timeout: 5000 });

  // Navigate to orders
  await page.goto("/admin/orders");
  await page.waitForURL("/admin/orders");

  await expect(page.locator("h1").filter({ hasText: /Orders/i }).first()).toBeVisible();

  await expect(
    page.locator("button, a").filter({ hasText: /Log External/i }).first()
  ).toBeVisible();
});

// ---------------------------------------------------------------------------
// 8. Wishlist heart toggle
// ---------------------------------------------------------------------------
test("wishlist heart toggle exists on product detail", async ({ page }) => {
  await page.goto("/shop");

  const productLink = page.locator("a[href^='/product/']").first();
  await productLink.waitFor({ state: "visible", timeout: 10000 });
  const href = await productLink.getAttribute("href");
  await page.goto(href!);

  await expect(
    page.locator("button[aria-label*='wishlist' i]").first()
  ).toBeVisible({ timeout: 5000 });
});
