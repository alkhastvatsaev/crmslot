import { test, expect, devices } from "@playwright/test";

const PROD = process.env.PLAYWRIGHT_PROD_URL ?? "https://crmslot.vercel.app";

type Diag = {
  url: string;
  finalUrl: string;
  title: string;
  consoleErrors: string[];
  pageErrors: string[];
  bodySnippet: string;
  testIds: string[];
  errorBoundary: boolean;
  satelliteLoading: boolean;
};

async function diagnose(page: import("@playwright/test").Page, path: string): Promise<Diag> {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => {
    pageErrors.push(err.message);
  });

  await page.goto(`${PROD}${path}`, { waitUntil: "domcontentloaded", timeout: 90_000 });
  await page.waitForTimeout(8_000);

  const testIds = await page.locator("[data-testid]").evaluateAll((nodes) =>
    nodes
      .map((n) => n.getAttribute("data-testid"))
      .filter((id): id is string => Boolean(id))
      .slice(0, 40)
  );

  const bodyText = await page.locator("body").innerText();
  const errorBoundary = /Une erreur inattendue s'est produite/i.test(bodyText);
  const satelliteLoading = (await page.getByTestId("satellite-app-redirect-loading").count()) > 0;

  return {
    url: path,
    finalUrl: page.url(),
    title: await page.title(),
    consoleErrors: consoleErrors.slice(0, 15),
    pageErrors: pageErrors.slice(0, 15),
    bodySnippet: bodyText.replace(/\s+/g, " ").slice(0, 500),
    testIds,
    errorBoundary,
    satelliteLoading,
  };
}

function logDiag(label: string, d: Diag) {
  // eslint-disable-next-line no-console
  console.log(`\n========== ${label} ==========`);
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(d, null, 2));
}

test.describe("Prod diagnostics", () => {
  test("admin / desktop", async ({ browser }) => {
    const context = await browser.newContext({ ...devices["Desktop Chrome"] });
    const page = await context.newPage();
    const d = await diagnose(page, "/");
    logDiag("ADMIN DESKTOP /", d);
    await page.screenshot({ path: "test-results/diag-admin-desktop.png", fullPage: true });
    expect(d.errorBoundary, `ErrorBoundary visible: ${d.bodySnippet}`).toBe(false);
    await context.close();
  });

  test("admin / mobile", async ({ browser }) => {
    const context = await browser.newContext({ ...devices["iPhone 13"] });
    const page = await context.newPage();
    const d = await diagnose(page, "/");
    logDiag("ADMIN MOBILE /", d);
    await page.screenshot({ path: "test-results/diag-admin-mobile.png", fullPage: true });
    await context.close();
  });

  test("client /m/demande mobile", async ({ browser }) => {
    const context = await browser.newContext({ ...devices["iPhone 13"] });
    const page = await context.newPage();
    const d = await diagnose(page, "/m/demande");
    logDiag("CLIENT /m/demande", d);
    await page.screenshot({ path: "test-results/diag-client-demande.png", fullPage: true });
    expect(d.errorBoundary, `ErrorBoundary: ${d.pageErrors.join("; ")}`).toBe(false);
    await context.close();
  });

  test("technician /m/technician mobile", async ({ browser }) => {
    const context = await browser.newContext({ ...devices["Pixel 7"] });
    const page = await context.newPage();
    const d = await diagnose(page, "/m/technician");
    logDiag("TECH /m/technician", d);
    await page.screenshot({ path: "test-results/diag-technician.png", fullPage: true });
    await context.close();
  });

  test("hub pages desktop — feature + billing", async ({ browser }) => {
    const context = await browser.newContext({ ...devices["Desktop Chrome"] });
    const page = await context.newPage();
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => pageErrors.push(err.message));

    await page.goto(`${PROD}/`, { waitUntil: "domcontentloaded", timeout: 90_000 });
    await expect(page.getByTestId("spotlight-trigger")).toBeVisible({ timeout: 60_000 });

    await page.getByTestId("spotlight-trigger").click();
    await page.getByTestId("nav-item-1").click();
    await page.waitForTimeout(4_000);
    const featureCenter = page.getByTestId("dashboard-pager-slot-1-panel-center");
    const featureError = await page
      .locator("text=Une erreur inattendue")
      .isVisible()
      .catch(() => false);
    logDiag("FEATURE HUB slot 1", {
      url: "/ → slot 1",
      finalUrl: page.url(),
      title: await page.title(),
      consoleErrors,
      pageErrors,
      bodySnippet: (await featureCenter.innerText().catch(() => "")).slice(0, 300),
      testIds: [],
      errorBoundary: featureError,
      satelliteLoading: false,
    });

    await page.getByTestId("spotlight-trigger").click();
    await page.getByTestId("nav-item-3").click();
    await page.waitForTimeout(4_000);
    const billingError = await page
      .locator("text=Une erreur inattendue")
      .isVisible()
      .catch(() => false);
    logDiag("BILLING HUB slot 3", {
      url: "/ → slot 3",
      finalUrl: page.url(),
      title: await page.title(),
      consoleErrors,
      pageErrors,
      bodySnippet: (
        await page
          .getByTestId("dashboard-pager-slot-3-panel-center")
          .innerText()
          .catch(() => "")
      ).slice(0, 300),
      testIds: [],
      errorBoundary: billingError,
      satelliteLoading: false,
    });

    await page.screenshot({ path: "test-results/diag-hubs-desktop.png", fullPage: true });
    await context.close();
  });
});
