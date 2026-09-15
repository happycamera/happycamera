import { test, expect, type Page } from "@playwright/test";
import { seedCatalog, FIXTURE_DSLR } from "./catalog";

const ADMIN_EMAIL = "happycamerabusiness@gmail.com";
const ADMIN_PASSWORD = "TempPass123!";

test.beforeAll(() => {
  seedCatalog("create");
});

test.afterAll(() => {
  seedCatalog("remove");
});

const UNIQUE = Date.now();
const VALID_SLUG = `e2e-subcat-valid-${UNIQUE}`;
const VALID_NAME = `E2E Subcat Valid ${UNIQUE}`;

const CATEGORY_SELECT = 'p:text-is("Category *") + div select';
const SUBCATEGORY_SELECT = 'label:text-is("Subcategory *") + select';

async function adminLogin(page: Page) {
  await page.goto("/admin/login");
  await page.fill("input[type='email']", ADMIN_EMAIL);
  await page.fill("input[type='password']", ADMIN_PASSWORD);
  await page.click("button[type='submit']");
  await page.waitForURL("/admin", { timeout: 30000 });
}

async function subcategoryOptions(page: Page): Promise<string[]> {
  const select = page.locator(SUBCATEGORY_SELECT);
  return select.locator("option").allTextContents();
}

test("single-product form rejects save without subcategory", async ({ page }) => {
  await adminLogin(page);
  await page.goto("/admin/products/new");

  // Fill every required field EXCEPT subcategory.
  await page.locator('label:text-is("Name *") + input').fill(`E2E No Subcat ${UNIQUE}`);
  await page.locator('label:text-is("Slug *") + input').fill(`e2e-no-subcat-${UNIQUE}`);
  await page.locator('label:text-is("Brand *") + input').fill("TestBrand");
  await page.locator('label:text-is("Price (RM) *") + input').fill("100");
  await page.locator('label:has-text("Description *") + textarea').fill("Test description.");

  // Category defaults to the first category (Lenses in local DB); leave Subcategory empty.
  await page.locator(CATEGORY_SELECT).selectOption({ index: 0 });

  await page.locator("button[type='submit']").click();

  await expect(page.locator("text=Subcategory is required.")).toBeVisible();
});

test("subcategory options change correctly when category changes", async ({ page }) => {
  await adminLogin(page);
  await page.goto("/admin/products/new");

  const categorySelect = page.locator(CATEGORY_SELECT);
  await expect(categorySelect).toBeVisible();

  await categorySelect.selectOption({ label: "Cameras" });
  let opts = await subcategoryOptions(page);
  for (const sub of ["Mirrorless", "Compact", "DSLR", "Cinema", "Instant", "Medium Format"]) {
    expect(opts, `Cameras should include ${sub}`).toContain(sub);
  }
  expect(opts, "Film should no longer be a Cameras subcategory").not.toContain("Film");
  expect(opts).not.toContain("Prime");
  expect(opts).not.toContain("Bags");

  await categorySelect.selectOption({ label: "Lenses" });
  opts = await subcategoryOptions(page);
  for (const sub of ["Zoom", "Mount Adapters", "Prime", "Teleconverters"]) {
    expect(opts, `Lenses should include ${sub}`).toContain(sub);
  }
  expect(opts).not.toContain("Mirrorless");
  expect(opts).not.toContain("Bags");

  await categorySelect.selectOption({ label: "Accessories" });
  opts = await subcategoryOptions(page);
  for (const sub of ["Batteries Chargers and Grips", "Flashes", "Lens Filters", "Memory Cards", "Handles", "Bags", "Others"]) {
    expect(opts, `Accessories should include ${sub}`).toContain(sub);
  }
  expect(opts).not.toContain("Prime");
  expect(opts).not.toContain("DSLR");
});

test("edit form pre-selects an existing product's subcategory", async ({ page }) => {
  await adminLogin(page);

  // E2E fixture DSLR product is a Cameras / DSLR product.
  await page.goto("/admin/products");
  const row = page.locator("tr", { hasText: FIXTURE_DSLR }).first();
  await row.waitFor({ state: "visible", timeout: 15000 });
  const editHref = await row.locator('a[title="Edit"]').getAttribute("href");
  expect(editHref).toMatch(/^\/admin\/products\/[^/]+\/edit$/);

  await page.goto(editHref!);
  await expect(page.locator("h1", { hasText: "Edit Product" })).toBeVisible();

  await expect(page.locator(CATEGORY_SELECT)).toHaveValue(/^[a-z0-9]+$/);
  await expect(page.locator(SUBCATEGORY_SELECT)).toHaveValue("DSLR");
});

test("CSV importer rejects a mismatched category/subcategory pair and accepts a valid one", async ({ page }) => {
  await adminLogin(page);

  const mismatchCsv = [
    "name,slug,brand,price,condition,categorySlug,subcategory",
    `E2E Mismatch,${VALID_SLUG}-mismatch,TestBrand,100,new,cameras,Zoom`,
  ].join("\n");

  const bad = await page.request.post("/api/products/upload", {
    multipart: {
      file: { name: "mismatch.csv", mimeType: "text/csv", buffer: Buffer.from(mismatchCsv) },
    },
  });
  expect(bad.status()).toBe(200);
  const badData = await bad.json();
  expect(badData.created).toBe(0);
  expect(badData.errors).toBeGreaterThan(0);
  const badRow = (badData.errorDetails as { row: number; message: string }[]).find((e) => e.row === 2);
  expect(badRow?.message).toContain('Invalid subcategory "Zoom" for category "cameras"');

  const validCsv = [
    "name,slug,brand,price,condition,categorySlug,subcategory",
    `${VALID_NAME},${VALID_SLUG},TestBrand,123.45,new,cameras,Mirrorless`,
  ].join("\n");

  const ok = await page.request.post("/api/products/upload", {
    multipart: {
      file: { name: "valid.csv", mimeType: "text/csv", buffer: Buffer.from(validCsv) },
    },
  });
  expect(ok.status()).toBe(200);
  const okData = await ok.json();
  expect(okData.created).toBe(1);
  expect(okData.errors).toBe(0);

  // Verify the created product has its subcategory persisted (via the edit form).
  await page.goto("/admin/products");
  const row = page.locator("tr", { hasText: VALID_NAME }).first();
  await row.waitFor({ state: "visible", timeout: 15000 });
  const editHref = await row.locator('a[title="Edit"]').getAttribute("href");
  await page.goto(editHref!);
  await expect(page.locator(CATEGORY_SELECT)).toHaveValue(/^[a-z0-9]+$/);
  await expect(page.locator(SUBCATEGORY_SELECT)).toHaveValue("Mirrorless");

  // Cleanup — delete the throwaway product.
  const id = editHref!.match(/\/admin\/products\/([^/]+)\/edit$/)?.[1] || "";
  const del = await page.request.delete(`/api/products/${id}`);
  expect(del.status()).toBe(200);
});

test("form and CSV both reject Film as a Cameras subcategory", async ({ page }) => {
  await adminLogin(page);

  // The single-product form no longer offers Film under Cameras.
  await page.goto("/admin/products/new");
  await page.locator(CATEGORY_SELECT).selectOption({ label: "Cameras" });
  const opts = await subcategoryOptions(page);
  expect(opts).not.toContain("Film");

  // CSV importer rejects a cameras/Film row.
  const filmCsv = [
    "name,slug,brand,price,condition,categorySlug,subcategory",
    "E2E Film Test,e2e-film-test,TestBrand,100,new,cameras,Film",
  ].join("\n");
  const res = await page.request.post("/api/products/upload", {
    multipart: {
      file: { name: "film.csv", mimeType: "text/csv", buffer: Buffer.from(filmCsv) },
    },
  });
  expect(res.status()).toBe(200);
  const data = await res.json();
  expect(data.created).toBe(0);
  const filmRow = (data.errorDetails as { row: number; message: string }[]).find((e) => e.row === 2);
  expect(filmRow?.message).toContain('Invalid subcategory "Film" for category "cameras"');
});

test("deleted Kodak Millennium Film Camera product is gone", async ({ page }) => {
  await page.goto("/product/kodak-millennium-film-test");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible({ timeout: 10000 });
});
