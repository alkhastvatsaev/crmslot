import {
  MOBILE_GALAXY_HEIGHT_PX,
  MOBILE_HEADER_HEIGHT_PX,
  MOBILE_PANEL_GAP_PX,
  MOBILE_SHELL_CLASS,
  MOBILE_SHELL_PAD_X_PX,
  MOBILE_TAB_BAR_HEIGHT_PX,
} from "@/core/ui/dashboardMobileLayout";

describe("dashboardMobileLayout", () => {
  it("expose des constantes alignées sur dashboard-mobile-layout.css", () => {
    expect(MOBILE_SHELL_PAD_X_PX).toBe(16);
    expect(MOBILE_HEADER_HEIGHT_PX).toBe(52);
    expect(MOBILE_GALAXY_HEIGHT_PX).toBe(56);
    expect(MOBILE_TAB_BAR_HEIGHT_PX).toBe(52);
    expect(MOBILE_PANEL_GAP_PX).toBe(16);
    expect(MOBILE_SHELL_CLASS).toBe("mobile-shell");
  });
});
