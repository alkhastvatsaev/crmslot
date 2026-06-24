import { test, expect, type Page } from "@playwright/test";

/** Portail client `/m/demande` — deep-link `bmClientChat=open`. */
export async function openPortalClientChatTab(page: Page): Promise<void> {
  await page.goto("/m/demande?bmClientChat=open");
  await expect(page.getByTestId("client-mobile-app")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId("company-hub-right-tab-chat")).toHaveAttribute(
    "aria-selected",
    "true",
    {
      timeout: 15_000,
    }
  );
  await expect(page.getByTestId("company-chat-panel")).toBeAttached({ timeout: 30_000 });
}

export async function skipIfStaffLoginGate(page: Page): Promise<void> {
  await page.goto("/");
  const loginGate = page.getByRole("heading", { name: /espace administrateur/i });
  if (await loginGate.isVisible({ timeout: 10_000 }).catch(() => false)) {
    test.skip(true, "Session staff requise pour l'inbox back-office.");
  }
  await expect(page.getByTestId("dashboard-pager-root")).toBeVisible({ timeout: 30_000 });
}

export async function openBackofficeChatTab(page: Page): Promise<void> {
  await skipIfStaffLoginGate(page);
  await expect(page.locator("#map-container")).toBeVisible({ timeout: 60_000 });
  const inbox = page.getByTestId("backoffice-inbox-panel");
  await expect(inbox).toBeVisible({ timeout: 60_000 });
  await page.getByTestId("backoffice-inbox-tab-chat").click();
  await expect(page.getByTestId("chat-day-clients-picker")).toBeVisible({ timeout: 30_000 });
}

export async function sendPortalChatMessage(page: Page, text: string): Promise<void> {
  const input = page.getByTestId("company-chat-input");
  await expect(input).toBeAttached({ timeout: 30_000 });
  await input.click({ force: true });
  await input.fill(text, { force: true });
  await page.getByTestId("company-chat-send").click({ force: true });
}

export async function expectPortalChatBubble(
  page: Page,
  role: "client" | "staff",
  text: string
): Promise<void> {
  const testId = role === "client" ? "company-chat-bubble-client" : "company-chat-bubble-staff";
  await expect(page.getByTestId(testId).filter({ hasText: text })).toBeVisible({ timeout: 45_000 });
}
