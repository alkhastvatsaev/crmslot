import { render, screen } from "@/test-utils/render";
import MobileProfileTopBar from "@/features/dashboard/components/MobileProfileTopBar";
import { MOBILE_SHELL_CONTRACT } from "@/features/dashboard/mobileShellContract";
import {
  MOBILE_PROFILE_BAR_CHROME_CLASS,
  MOBILE_PROFILE_BAR_CLASS,
  MOBILE_SHELL_SLOT_GRID_CLASS,
} from "@/core/ui/dashboardMobileLayout";

describe("MobileProfileTopBar", () => {
  it("expose les testIds contrat et le rail profil actif", () => {
    render(
      <MobileProfileTopBar>
        <span data-testid="chip-child">Jean</span>
      </MobileProfileTopBar>
    );

    const topBar = screen.getByTestId(MOBILE_SHELL_CONTRACT.testIds.topBar);
    expect(topBar).toHaveClass(MOBILE_SHELL_SLOT_GRID_CLASS, MOBILE_PROFILE_BAR_CLASS);
    expect(topBar.querySelector(`.${MOBILE_PROFILE_BAR_CHROME_CLASS}`)).toBeTruthy();
    expect(screen.getByTestId("mobile-header-profile-rail")).toBeInTheDocument();
    expect(screen.getByTestId("mobile-header-profile")).toHaveAttribute(
      "data-mobile-header-rail-active",
      "true"
    );
    expect(screen.getByTestId("chip-child")).toBeInTheDocument();
  });
});
