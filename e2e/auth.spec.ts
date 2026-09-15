import { test, expect } from "@playwright/test";
import { execSync } from "child_process";

const ADMIN_EMAIL = "happycamerabusiness@gmail.com";
const ADMIN_PASSWORD = "TempPass123!";
const CUSTOMER_EMAIL = "e2e-customer@happycamera.com";
const CUSTOMER_PASSWORD = "customer123";

const seed = (flag: string) =>
  `node --env-file=.env.local --import tsx scripts/seed-test-customer.ts ${flag}`;

test.beforeAll(() => {
  execSync(seed("--create"), { stdio: "inherit" });
});

test.afterAll(() => {
  execSync(seed("--remove"), { stdio: "inherit" });
});

test.describe("Area 4 — Login scenarios", () => {
  test("admin credentials login reaches the dashboard", async ({ page }) => {
    await page.goto("/admin/login");
    await page.fill("input[type='email']", ADMIN_EMAIL);
    await page.fill("input[type='password']", ADMIN_PASSWORD);
    await page.click("button[type='submit']");
    await page.waitForURL((url) => url.pathname === "/admin", { timeout: 10000 });

    await expect(
      page.getByRole("paragraph").filter({ hasText: /^Products$/ }).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("customer credentials login cannot access admin (role gate)", async ({ page }) => {
    // Login at /admin/login with customer credentials — the page pushes /admin,
    // but the guard must bounce the customer to the storefront.
    await page.goto("/admin/login");
    await page.fill("input[type='email']", CUSTOMER_EMAIL);
    await page.fill("input[type='password']", CUSTOMER_PASSWORD);
    await page.click("button[type='submit']");
    await page.waitForURL((url) => url.pathname === "/", { timeout: 10000 });

    // Direct navigation to /admin and /admin/products must also bounce.
    await page.goto("/admin");
    await page.waitForURL((url) => url.pathname === "/", { timeout: 10000 });

    await page.goto("/admin/products");
    await page.waitForURL((url) => url.pathname === "/", { timeout: 10000 });

    // Admin APIs reject a logged-in (non-admin) session.
    const postProduct = await page.request.post("/api/products", {
      data: { name: "x" },
    });
    expect(postProduct.status()).toBe(401);

    const patchOrder = await page.request.patch("/api/orders/some-id", {
      data: { status: "PAID" },
    });
    expect(patchOrder.status()).toBe(401);

    // The customer session itself still works on customer-facing routes.
    await page.goto("/account");
    await expect(
      page.getByRole("heading", { name: "Order History" })
    ).toBeVisible({ timeout: 5000 });
  });

  test("failed login shows one generic message — no account-existence leak", async ({ page }) => {
    await page.goto("/admin/login");

    // Wrong password for a real account.
    await page.fill("input[type='email']", ADMIN_EMAIL);
    await page.fill("input[type='password']", "definitely-wrong");
    await page.click("button[type='submit']");
    await expect(page.getByText("Invalid email or password")).toBeVisible();

    // Nonexistent account — must render the SAME message.
    await page.fill("input[type='email']", "ghost@nowhere.example");
    await page.fill("input[type='password']", "whatever");
    await page.click("button[type='submit']");
    await expect(page.getByText("Invalid email or password")).toHaveCount(1);

    // After a failed attempt the admin area stays locked.
    await page.goto("/admin");
    await page.waitForURL((url) => url.pathname === "/admin/login", { timeout: 10000 });
  });

  test("customer Google sign-in UI renders with generic OAuth error handling", async ({ page }) => {
    // The unified /login page exposes Google sign-in for customers.
    await page.goto("/login");
    await expect(page.getByRole("button", { name: /Sign in with Google/i })).toBeVisible();

    // A failed OAuth round-trip must land on /login (not /admin/login) with a
    // generic message — the proxy reroutes /api/auth/signin?error=OAuth*.
    await page.goto("/api/auth/signin?error=OAuthCallback");
    await page.waitForURL((url) => url.pathname === "/login", { timeout: 10000 });
    await expect(
      page.getByText(/We couldn't authenticate your account/)
    ).toBeVisible();

    // The same holds for other OAuth error codes.
    await page.goto("/api/auth/signin?error=AccessDenied");
    await page.waitForURL((url) => url.pathname === "/login", { timeout: 10000 });
    await expect(page.getByText("Sign-in was denied.")).toBeVisible();

    // Unauthenticated /account bounces to the storefront.
    await page.goto("/account");
    await page.waitForURL((url) => url.pathname === "/", { timeout: 10000 });
  });
});
