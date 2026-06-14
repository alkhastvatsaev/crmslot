import { test, expect } from "@playwright/test";

/** Aligné sur `e2eSeedPortalQuote.ts`. */
const E2E_PORTAL_QUOTE_DOC_ID = "e2e-quote-portal-1";
const E2E_PORTAL_QUOTE_TOKEN = "e2e00000-0000-4000-8000-000000000001";

const skipAutoSeed = process.env.E2E_SKIP_SEED === "true";
const manualToken = process.env.E2E_PORTAL_TOKEN?.trim() || "";

test.describe("Portal quote & payment smoke", () => {
  test.describe("API guards", () => {
    test("GET /api/portal rejects invalid token", async ({ request }) => {
      const res = await request.get("/api/portal/not-a-valid-uuid");
      expect(res.status()).toBe(400);
    });

    test("POST accept rejects invalid token", async ({ request }) => {
      const res = await request.post("/api/portal/not-a-valid-uuid/quotes/q-1/accept", {
        data: {},
      });
      expect(res.status()).toBe(400);
    });

    test("POST decline rejects invalid token", async ({ request }) => {
      const res = await request.post("/api/portal/not-a-valid-uuid/quotes/q-1/decline", {
        data: {},
      });
      expect(res.status()).toBe(400);
    });
  });

  test.describe("Full flow (Firebase Admin)", () => {
    test.skip(
      skipAutoSeed && !manualToken,
      "Seed auto (dev) ou définir E2E_PORTAL_TOKEN / E2E_SKIP_SEED=true."
    );

    let portalToken = manualToken || E2E_PORTAL_QUOTE_TOKEN;
    const quoteId = E2E_PORTAL_QUOTE_DOC_ID;

    test.beforeAll(async ({ request }) => {
      if (!skipAutoSeed && !manualToken) {
        const seedRes = await request.post("/api/e2e/seed-portal-quote", {
          data: { scenario: "assigned" },
        });
        const seedBody = (await seedRes.json()) as {
          ok?: boolean;
          portalToken?: string;
          error?: string;
        };
        if (!seedRes.ok()) {
          test.skip(
            true,
            `Seed indisponible (${seedRes.status()}): ${seedBody.error ?? "Firebase Admin requis"}`
          );
        }
        expect(seedBody.ok, seedBody.error).toBe(true);
        portalToken = seedBody.portalToken ?? portalToken;
      }
      expect(portalToken.length).toBeGreaterThan(10);
    });

    test("GET portal exposes actionable quote", async ({ request }) => {
      const res = await request.get(`/api/portal/${encodeURIComponent(portalToken)}`);
      expect(res.ok(), `portal GET ${res.status()}`).toBeTruthy();
      const body = (await res.json()) as {
        id?: string;
        quotes?: Array<{ id: string; canRespond: boolean; effectiveStatus: string }>;
      };
      expect(body.quotes?.length).toBeGreaterThan(0);
      const quote = body.quotes!.find((q) => q.id === quoteId) ?? body.quotes![0];
      expect(quote.canRespond).toBe(true);
      expect(quote.effectiveStatus).toBe("sent");
    });

    test("UI accept quote on /suivi/[token]", async ({ page }) => {
      await page.goto(`/suivi/${encodeURIComponent(portalToken)}`);
      await expect(page.getByTestId("portal-quote-panel")).toBeVisible({ timeout: 30_000 });
      await expect(page.getByTestId(`portal-quote-accept-${quoteId}`)).toBeVisible();

      const acceptRes = page.waitForResponse(
        (res) =>
          res.url().includes(`/api/portal/${encodeURIComponent(portalToken)}/quotes/`) &&
          res.url().includes("/accept") &&
          res.request().method() === "POST",
        { timeout: 30_000 }
      );

      await page.getByTestId(`portal-quote-accept-${quoteId}`).click();
      const res = await acceptRes;
      expect(res.ok(), `accept HTTP ${res.status()}`).toBeTruthy();

      await expect(page.getByTestId(`portal-quote-status-${quoteId}`)).toBeVisible({
        timeout: 20_000,
      });
      await expect(page.getByTestId(`portal-quote-accept-${quoteId}`)).toHaveCount(0);
    });
  });

  test.describe("Quote accept → invoice → payment link (API)", () => {
    test.skip(
      skipAutoSeed && !manualToken,
      "Seed auto (dev) ou définir E2E_PORTAL_TOKEN / E2E_SKIP_SEED=true."
    );

    let portalToken = manualToken || E2E_PORTAL_QUOTE_TOKEN;
    const quoteId = E2E_PORTAL_QUOTE_DOC_ID;

    test.beforeAll(async ({ request }) => {
      if (!skipAutoSeed && !manualToken) {
        const seedRes = await request.post("/api/e2e/seed-portal-quote", {
          data: { scenario: "done" },
        });
        const seedBody = (await seedRes.json()) as {
          ok?: boolean;
          portalToken?: string;
          error?: string;
        };
        if (!seedRes.ok()) {
          test.skip(
            true,
            `Seed indisponible (${seedRes.status()}): ${seedBody.error ?? "Firebase Admin requis"}`
          );
        }
        expect(seedBody.ok, seedBody.error).toBe(true);
        portalToken = seedBody.portalToken ?? portalToken;
      }
    });

    test("accept on done dossier exposes payment card", async ({ request, page }) => {
      const acceptRes = await request.post(
        `/api/portal/${encodeURIComponent(portalToken)}/quotes/${encodeURIComponent(quoteId)}/accept`
      );
      const acceptBody = (await acceptRes.json()) as {
        ok?: boolean;
        invoiceIssued?: boolean;
        error?: string;
      };
      expect(acceptRes.ok(), acceptBody.error).toBeTruthy();
      expect(acceptBody.ok).toBe(true);
      expect(acceptBody.invoiceIssued).toBe(true);

      const portalRes = await request.get(`/api/portal/${encodeURIComponent(portalToken)}`);
      expect(portalRes.ok()).toBeTruthy();
      const portal = (await portalRes.json()) as {
        invoiceAmountCents?: number | null;
        paymentLinkUrl?: string | null;
        status?: string;
      };
      expect((portal.invoiceAmountCents ?? 0) > 0).toBe(true);
      expect(portal.paymentLinkUrl?.trim().length).toBeGreaterThan(0);
      expect(portal.status).toBe("invoiced");

      await page.goto(`/suivi/${encodeURIComponent(portalToken)}`);
      await expect(page.getByTestId("portal-payment-card")).toBeVisible({ timeout: 30_000 });
      await expect(page.getByTestId("portal-pay-button")).toBeVisible();
    });
  });
});
