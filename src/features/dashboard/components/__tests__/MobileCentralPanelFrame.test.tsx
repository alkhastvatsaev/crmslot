import { render, screen } from "@/test-utils/render";
import MobileCentralPanelFrame from "@/features/dashboard/components/MobileCentralPanelFrame";
import { MOBILE_HUB_LAYOUT_CLASS } from "@/core/ui/dashboardMobileLayout";

describe("MobileCentralPanelFrame", () => {
  it("applique le layout hub et le chrome panel-glass", () => {
    render(
      <MobileCentralPanelFrame
        testId="central-panel"
        layoutTestId="central-layout"
        sectionDataVariant="selector"
      >
        <p>contenu central</p>
      </MobileCentralPanelFrame>
    );

    expect(screen.getByTestId("central-layout")).toHaveClass(MOBILE_HUB_LAYOUT_CLASS);
    const panel = screen.getByTestId("central-panel");
    expect(panel).toHaveAttribute("data-variant", "selector");
    expect(panel).toHaveClass("panel-glass");
    expect(screen.getByText("contenu central")).toBeInTheDocument();
  });
});
