import {
  buildStockCenterMaterialOrderPrompt,
  consumePendingMaterialAgentQuickPrompt,
  navigateMaterialAgentWithQuickPrompt,
  peekPendingMaterialAgentQuickPrompt,
} from "@/features/featureHub/companyStockChatbot";
import { FEATURE_HUB_SLOT_INDEX } from "@/features/featureHub/featureHubConstants";

describe("companyStockChatbot pending prompt", () => {
  beforeEach(() => {
    consumePendingMaterialAgentQuickPrompt();
  });

  it("builds stock center order prompt", () => {
    expect(
      buildStockCenterMaterialOrderPrompt({
        quantity: 2,
        description: "Cylindre européen 80 mm",
        reference: "CYL-EURO-80",
        companyName: "ACME Serrures",
      })
    ).toBe('Commander 2× "Cylindre européen 80 mm" (réf. CYL-EURO-80) — société : ACME Serrures');
  });

  it("queues prompt when navigating away from material page", () => {
    const pager = { pageIndex: 6, setPageIndex: jest.fn() };
    navigateMaterialAgentWithQuickPrompt(pager, 'Commander 1× "Test"');
    expect(pager.setPageIndex).toHaveBeenCalledWith(FEATURE_HUB_SLOT_INDEX);
    expect(peekPendingMaterialAgentQuickPrompt()).toBe('Commander 1× "Test"');
    expect(consumePendingMaterialAgentQuickPrompt()).toBe('Commander 1× "Test"');
    expect(peekPendingMaterialAgentQuickPrompt()).toBeNull();
  });
});
