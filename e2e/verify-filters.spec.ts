import { test, expect } from "@playwright/test";
import { seedCatalog } from "./catalog";

test.beforeAll(() => {
  seedCatalog("create");
});

test.afterAll(() => {
  seedCatalog("remove");
});

test.describe("shop filter fixes", () => {
  test("badge count only tracks brand/condition/price", async ({ page }) => {
    // Desktop sidebar renders the Filter heading + the badge (span.rounded-full.border-black)
    const sidebar = page.locator("aside");
    const badge = sidebar.locator("span.border-black");

    // no params -> no badge
    await page.goto("/shop");
    await expect(sidebar.getByText("Filters", { exact: true })).toBeVisible();
    await expect(badge).toHaveCount(0);

    // category pill only -> no badge
    await page.goto("/shop?category=cameras");
    await expect(page.locator("a[href^='/shop?category=']").first()).toBeVisible();
    await expect(badge).toHaveCount(0);

    // category + condition -> badge 1 (condition only)
    await page.goto("/shop?category=cameras&condition=new");
    await expect(badge).toHaveText("1");

    // brand + price -> badge 2
    await page.goto("/shop?brand=sony&minPrice=1000&maxPrice=3000");
    await expect(badge).toHaveText("2");
  });

  test("brand list dedupes case-insensitively and matches case-insensitively", async ({ page }) => {
    await page.goto("/shop?brand=sony");

    // Open the Brand accordion
    await page.getByRole("button", { name: "Brand", exact: true }).click();

    // brand=sony resolves against a Sony product (case-insensitive match)
    const sidebar = page.locator("aside");
    const sonyLabel = sidebar.locator("label").filter({ hasText: "Sony" }).first();
    await expect(sonyLabel.locator('input[type="checkbox"]')).toBeChecked();

    // At least one product card renders in the grid (each card = 2 product links)
    const cards = page.locator("a[href^='/product/']");
    await expect(cards.first()).toBeVisible();
    expect(await cards.count()).toBeGreaterThan(0);

    // Only ONE brand entry for Sony in the sidebar (no duplicate casing)
    await expect(sidebar.getByText("Sony", { exact: true })).toHaveCount(1);
  });
});