import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const publicPages = [
  { path: "/", heading: /backed by science/i },
  { path: "/shop", heading: /shop|compounds/i },
  { path: "/coa", heading: /every batch/i },
] as const;

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("bare-compounds-age-verified", "true");
  });
});

for (const publicPage of publicPages) {
  test(`${publicPage.path} renders without accessibility violations`, async ({
    page,
  }) => {
    const response = await page.goto(publicPage.path);

    expect(response?.ok()).toBe(true);
    await expect(page.locator("main")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: publicPage.heading }),
    ).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(results.violations).toEqual([]);
  });
}

test("public pages fit the configured viewport", async ({ page }) => {
  await page.goto("/shop");
  await expect(page.locator("main")).toBeVisible();

  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
  }));

  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport + 1);
});

test("HTML responses use a nonce-based script policy", async ({ page }) => {
  const response = await page.goto("/");
  const policy = response?.headers()["content-security-policy"] ?? "";
  const scriptDirective =
    policy.split(";").find((directive) => directive.trim().startsWith("script-src")) ??
    "";

  expect(scriptDirective).toContain("'nonce-");
  expect(scriptDirective).toContain("'strict-dynamic'");
  expect(scriptDirective).not.toContain("'unsafe-inline'");
});

test("an unauthenticated visitor can reach account sign in", async ({
  page,
}) => {
  const response = await page.goto("/account");

  expect(response?.ok()).toBe(true);
  await expect(
    page.getByRole("heading", { level: 1, name: /researcher account/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true }).last(),
  ).toBeVisible();
});

test("private workspaces redirect unauthenticated visitors", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/account\?.*reason=auth/);

  await page.goto("/account/orders");
  await expect(page).toHaveURL(/\/account\?.*reason=auth/);
});

test("the catalog links to a complete product detail page", async ({ page }) => {
  await page.goto("/shop");
  const productLink = page.locator('a[href^="/compounds/"]').first();
  const href = await productLink.getAttribute("href");
  const productName = (await productLink.locator("span").first().textContent())?.trim();
  expect(href).toMatch(/^\/compounds\/[^/]+$/);
  await page.goto(href!);

  await expect(page).toHaveURL(/\/compounds\/[^/]+$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    productName ?? "",
  );
  await expect(page.getByText(/for research use only/i).first()).toBeVisible();
});
