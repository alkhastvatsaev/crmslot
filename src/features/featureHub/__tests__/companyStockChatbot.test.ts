import {
  buildStockCenterMaterialOrderPrompt,
  consumePendingMaterialAgentQuickPrompt,
  dispatchMaterialAgentQuickPrompt,
  MATERIAL_AGENT_FOCUS_ORDERS_RAIL_EVENT,
  scheduleMaterialOrdersMobileRailFocus,
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

  it("schedules mobile orders rail focus after supplier order", () => {
    jest.useFakeTimers();
    const handler = jest.fn();
    window.addEventListener(MATERIAL_AGENT_FOCUS_ORDERS_RAIL_EVENT, handler);
    scheduleMaterialOrdersMobileRailFocus();
    expect(handler).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1000);
    expect(handler).toHaveBeenCalledTimes(1);
    window.removeEventListener(MATERIAL_AGENT_FOCUS_ORDERS_RAIL_EVENT, handler);
    jest.useRealTimers();
  });

  it("queues prompt on material page when agent is not mounted yet", () => {
    dispatchMaterialAgentQuickPrompt('Commander 1× "Cylindre"');
    expect(peekPendingMaterialAgentQuickPrompt()).toBe('Commander 1× "Cylindre"');
    expect(consumePendingMaterialAgentQuickPrompt()).toBe('Commander 1× "Cylindre"');
  });

  it("queues prompt when navigating away from material page", () => {
    const pager = {
      pageIndex: 6,
      pageCount: 9,
      setPageIndex: jest.fn(),
      goNext: jest.fn(),
      goPrev: jest.fn(),
    };
    navigateMaterialAgentWithQuickPrompt(pager, 'Commander 1× "Test"');
    expect(pager.setPageIndex).toHaveBeenCalledWith(FEATURE_HUB_SLOT_INDEX);
    expect(peekPendingMaterialAgentQuickPrompt()).toBe('Commander 1× "Test"');
    expect(consumePendingMaterialAgentQuickPrompt()).toBe('Commander 1× "Test"');
    expect(peekPendingMaterialAgentQuickPrompt()).toBeNull();
  });
});
