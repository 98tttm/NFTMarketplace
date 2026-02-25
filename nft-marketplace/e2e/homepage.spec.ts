import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("loads and shows hero section", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=NFT Market")).toBeVisible();
  });

  test("renders navigation links", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('a[href="/marketplace"]')).toBeVisible();
    await expect(page.locator('a[href="/collections"]')).toBeVisible();
    await expect(page.locator('a[href="/rankings"]')).toBeVisible();
    await expect(page.locator('a[href="/activity"]')).toBeVisible();
  });

  test("shows Connect Wallet button when not connected", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=Connect Wallet")).toBeVisible();
  });
});

test.describe("Marketplace", () => {
  test("loads marketplace page", async ({ page }) => {
    await page.goto("/marketplace");
    await expect(page).toHaveURL(/marketplace/);
  });

  test("displays filter sidebar on desktop", async ({ page }) => {
    await page.goto("/marketplace");
    await expect(page.locator("text=Filters").first()).toBeVisible();
  });

  test("shows NFT items in the grid", async ({ page }) => {
    await page.goto("/marketplace");
    await page.waitForTimeout(1000);
    const cards = page.locator('[class*="rounded-2xl"]');
    expect(await cards.count()).toBeGreaterThan(0);
  });
});

test.describe("NFT Detail Page", () => {
  test("loads NFT detail with mock data", async ({ page }) => {
    await page.goto("/nft/mock-1");
    await expect(page.locator("text=Abstract Dimension")).toBeVisible();
  });

  test("shows price section", async ({ page }) => {
    await page.goto("/nft/mock-1");
    await expect(page.locator("text=ETH").first()).toBeVisible();
  });
});

test.describe("Search", () => {
  test("Ctrl+K opens search modal", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Control+k");
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
  });

  test("search results page loads", async ({ page }) => {
    await page.goto("/search?q=test");
    await expect(page.locator("text=Search Results")).toBeVisible();
  });
});

test.describe("Collections", () => {
  test("loads collections browse page", async ({ page }) => {
    await page.goto("/collections");
    await expect(page.locator("text=Collections").first()).toBeVisible();
  });
});

test.describe("Activity", () => {
  test("loads activity page", async ({ page }) => {
    await page.goto("/activity");
    await expect(page.locator("text=Activity").first()).toBeVisible();
  });
});

test.describe("Rankings", () => {
  test("loads rankings page", async ({ page }) => {
    await page.goto("/rankings");
    await expect(page.locator("text=Rankings").first()).toBeVisible();
  });
});
