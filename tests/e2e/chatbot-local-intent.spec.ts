import { test, expect, type Page } from "@playwright/test";

/** Aligné sur `AI_ASSISTANT_SLOT_INDEX` (page carrousel chatbot). */
const CHATBOT_NAV_ITEM_INDEX = 4;

async function openChatbotPage(page: Page) {
  await page.goto("/");
  await expect(page.locator('[data-testid="dashboard-pager-root"]')).toBeVisible();

  await page.locator('[data-testid="spotlight-trigger"]').click();
  await page.locator(`[data-testid="nav-item-${CHATBOT_NAV_ITEM_INDEX}"]`).click();

  await expect(page.locator('[data-testid="chatbot-chat"]')).toBeVisible({
    timeout: 20_000,
  });
}

test.describe("Chatbot smoke", () => {
  test("user message hits /api/ai/chatbot (SSE mock, no réponse locale)", async ({ page }) => {
    await page.route("**/api/ai/chatbot", async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }
      const lines = [
        JSON.stringify({ type: "text", delta: "Réponse de test (OpenAI simulé)." }),
        JSON.stringify({
          type: "done",
          apiMessages: [
            { role: "user", content: "résumé" },
            { role: "assistant", content: "Réponse de test (OpenAI simulé)." },
          ],
        }),
      ].join("\n");
      await route.fulfill({
        status: 200,
        headers: { "Content-Type": "text/event-stream; charset=utf-8" },
        body: `${lines}\n`,
      });
    });

    await openChatbotPage(page);

    const input = page.locator('[data-testid="chatbot-input"]');
    await expect(input).toBeVisible();
    await input.fill("résumé");
    await input.press("Enter");

    await expect(page.locator('[data-testid="chatbot-bubble-assistant"]').last()).toContainText(
      /OpenAI simulé|résumé/i,
      { timeout: 15_000 },
    );
  });

  test("chatbot right rail PDF panel mount is present on chatbot page", async ({ page }) => {
    await openChatbotPage(page);
    await expect(page.locator('[data-testid="chatbot-right-rail"]')).toBeVisible();
    await expect(page.locator('[data-testid="chatbot-pdf-preview-panel"]')).toBeVisible();
  });
});
