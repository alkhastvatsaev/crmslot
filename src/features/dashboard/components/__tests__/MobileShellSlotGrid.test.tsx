import { render, screen } from "@/test-utils/render";
import MobileShellSlotGrid from "@/features/dashboard/components/MobileShellSlotGrid";
import { MOBILE_SHELL_SLOT_GRID_CLASS } from "@/core/ui/dashboardMobileLayout";

describe("MobileShellSlotGrid", () => {
  it("compose la grille 3 colonnes avec chrome central", () => {
    render(
      <MobileShellSlotGrid
        data-testid="slot-grid"
        rootClassName="root-extra"
        chromeClassName="chrome-extra"
      >
        <span>contenu</span>
      </MobileShellSlotGrid>
    );

    const grid = screen.getByTestId("slot-grid");
    expect(grid).toHaveClass(MOBILE_SHELL_SLOT_GRID_CLASS, "root-extra");
    expect(screen.getByText("contenu").parentElement).toHaveClass("chrome-extra");
    expect(grid.querySelectorAll(":scope > div")).toHaveLength(3);
  });
});
