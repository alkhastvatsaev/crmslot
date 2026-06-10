import { render, screen } from "@/test-utils/render";
import MobileTriplePanelLayout from "@/features/dashboard/components/MobileTriplePanelLayout";

describe("MobileTriplePanelLayout", () => {
  it("rend les trois rails avec leurs data-testid", () => {
    render(
      <MobileTriplePanelLayout
        rootTestId="mobile-triple-root"
        leftTestId="mobile-triple-left"
        centerTestId="mobile-triple-center"
        rightTestId="mobile-triple-right"
        left={<span>gauche</span>}
        center={<span>centre</span>}
        right={<span>droite</span>}
      />
    );

    expect(screen.getByTestId("mobile-triple-root")).toBeInTheDocument();
    expect(screen.getByTestId("mobile-triple-left")).toBeInTheDocument();
    expect(screen.getByTestId("mobile-triple-center")).toBeInTheDocument();
    expect(screen.getByTestId("mobile-triple-right")).toBeInTheDocument();
    expect(screen.getByText("centre")).toBeInTheDocument();
  });
});
