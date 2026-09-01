import { expect, test, type Page } from "@playwright/test";

const localFixturesEnabled = process.env.E2E_LOCAL_FIXTURES === "true";

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/account");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).last().click();
  await expect(page).toHaveURL(/\/account(?:\?.*)?$/);
}

test.describe("seeded customer and owner journeys", () => {
  test.skip(
    !localFixturesEnabled,
    "Requires the deterministic Supabase local seed.",
  );

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("bare-compounds-age-verified", "true");
    });
  });

  test("a customer signs in and opens their profile workspace", async ({
    page,
  }) => {
    await signIn(page, "customer@bare.local", "Phase7-local-customer!");
    await page.goto("/account/profile");

    await expect(page).toHaveURL(/\/account\/profile$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Profile" }),
    ).toBeVisible();
    await expect(page.getByText("active", { exact: true })).toBeVisible();
  });

  test("an owner reaches admin and notification health", async ({ page }) => {
    await signIn(page, "owner@bare.local", "Phase7-local-owner!");
    await page.goto("/admin");

    await expect(page).toHaveURL(/\/admin$/);
    await expect(
      page.getByRole("navigation", { name: "Admin sections" }),
    ).toBeVisible();

    await page.goto("/admin/notifications");
    await expect(
      page.getByRole("heading", { level: 1, name: "Notification health" }),
    ).toBeVisible();
  });

  test("an authenticated customer can add seeded inventory to the cart", async ({
    page,
  }) => {
    await signIn(page, "customer@bare.local", "Phase7-local-customer!");
    await page.goto("/shop");

    const product = page.getByRole("article").filter({
      hasText: "Local Test Compound",
    });
    await product.getByRole("button", { name: "Add" }).click();
    await expect(product.getByRole("button", { name: "Added" })).toBeVisible();

    await page.goto("/cart");
    await expect(page.getByText("Local Test Compound")).toBeVisible();
    await page.goto("/checkout");
    await expect(
      page.getByRole("heading", { level: 1, name: /manual payment/i }),
    ).toBeVisible();
  });
});
