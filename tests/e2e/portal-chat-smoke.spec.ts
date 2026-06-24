import { test, expect } from "@playwright/test";
import {
  expectPortalChatBubble,
  openBackofficeChatTab,
  openPortalClientChatTab,
  sendPortalChatMessage,
  skipIfStaffLoginGate,
} from "./helpers/portalChat";

const skipAutoSeed = process.env.E2E_SKIP_SEED === "true";
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() ?? "";
const portalCompanyId = process.env.NEXT_PUBLIC_CLIENT_PORTAL_DEFAULT_COMPANY_ID?.trim() ?? "";
const hasLiveFirebase = Boolean(projectId && projectId !== "placeholder" && portalCompanyId);

test.describe("Portal chat client ↔ admin", () => {
  test.describe("UI smoke (sans Firestore)", () => {
    test("dashboard — inbox chat liste visible", async ({ page }) => {
      await openBackofficeChatTab(page);
      await expect(page.getByTestId("chat-day-global-btn")).toBeVisible();
    });
  });

  test.describe("API guards", () => {
    test("POST /api/portal-chat/ensure-profile sans auth → 401", async ({ request }) => {
      const res = await request.post("/api/portal-chat/ensure-profile", {
        data: { companyId: "co-test" },
      });
      expect(res.status()).toBe(401);
    });

    test("POST /api/portal-chat/notify-staff sans auth → 401", async ({ request }) => {
      const res = await request.post("/api/portal-chat/notify-staff", {
        data: { companyId: "co-test", preview: "hello" },
      });
      expect(res.status()).toBe(401);
    });
  });

  test.describe("Flux live Firebase", () => {
    test.skip(
      !hasLiveFirebase,
      "Définir NEXT_PUBLIC_FIREBASE_* réels + NEXT_PUBLIC_CLIENT_PORTAL_DEFAULT_COMPANY_ID."
    );

    test("client envoie → admin lit → staff répond → client reçoit", async ({ page }) => {
      test.setTimeout(180_000);
      await skipIfStaffLoginGate(page);
      const marker = `e2e-portal-chat-${Date.now()}`;
      const staffReply = `${marker}-reply`;

      await page.goto("/m/demande");
      await openPortalClientChatTab(page);

      const companyHint = page.getByTestId("company-chat-company-hint");
      if (await companyHint.isVisible().catch(() => false)) {
        test.skip(true, "Société portail non configurée côté build.");
      }

      await sendPortalChatMessage(page, marker);
      await expectPortalChatBubble(page, "client", marker);

      await page.goto("/");
      await openBackofficeChatTab(page);

      const clientRow = page.locator('[data-testid^="chat-day-client-row-"]').first();
      await expect(clientRow).toBeVisible({ timeout: 45_000 });
      await clientRow.click();

      await expect(page.getByTestId("company-chat-panel")).toBeVisible();
      await expectPortalChatBubble(page, "client", marker);

      await sendPortalChatMessage(page, staffReply);
      await expectPortalChatBubble(page, "staff", staffReply);

      await page.goto("/m/demande");
      await openPortalClientChatTab(page);
      await expectPortalChatBubble(page, "staff", staffReply);
    });
  });

  test.describe("Seed admin (Firebase Admin)", () => {
    test.skip(
      skipAutoSeed || !hasLiveFirebase,
      "Firebase live + seed (retirer E2E_SKIP_SEED) ou Admin indisponible."
    );

    let chatThreadId = "";
    let seededBody = "";

    test.beforeAll(async ({ request }) => {
      const seedRes = await request.post("/api/e2e/seed-portal-chat", { data: { reset: true } });
      const seedBody = (await seedRes.json()) as {
        ok?: boolean;
        chatThreadId?: string;
        body?: string;
        error?: string;
      };
      if (!seedRes.ok()) {
        test.skip(true, `Seed indisponible (${seedRes.status()}): ${seedBody.error ?? "?"}`);
      }
      expect(seedBody.ok, seedBody.error).toBe(true);
      chatThreadId = seedBody.chatThreadId ?? "";
      seededBody = seedBody.body ?? "";
      expect(chatThreadId.length).toBeGreaterThan(5);
      expect(seededBody.length).toBeGreaterThan(3);
    });

    test("admin ouvre le fil seedé et voit le message client", async ({ page }) => {
      test.setTimeout(120_000);
      await page.goto("/");
      await openBackofficeChatTab(page);

      const row = page.getByTestId(`chat-day-client-row-${chatThreadId}`);
      await expect(row).toBeVisible({ timeout: 45_000 });
      await row.click();

      await expectPortalChatBubble(page, "client", seededBody);
    });
  });
});
