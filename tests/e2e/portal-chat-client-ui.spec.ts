import { test, expect } from "@playwright/test";
import { openPortalClientChatTab } from "./helpers/portalChat";

test.describe("Portal chat client UI", () => {
  test("portail /m/demande — deep-link chat + composer monté", async ({ page }) => {
    await openPortalClientChatTab(page);
    await expect(page.getByTestId("company-chat-input")).toBeAttached();
    await expect(page.getByTestId("company-chat-send")).toBeAttached();
  });
});
