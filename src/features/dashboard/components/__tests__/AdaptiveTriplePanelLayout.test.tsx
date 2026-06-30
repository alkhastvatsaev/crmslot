import React from "react";
import { render, screen } from "@/test-utils/render";
import AdaptiveTriplePanelLayout from "@/features/dashboard/components/AdaptiveTriplePanelLayout";

const mockUseMobileHubLayout = jest.fn(() => true);

jest.mock("@/context/LayoutShellContext", () => ({
  useMobileHubLayout: () => mockUseMobileHubLayout(),
}));

jest.mock("@/features/dashboard/MobileHubRailContext", () => ({
  useMobileHubRailRegistration: () => jest.fn(),
  useMobileHubRailSnapshot: () => null,
  useRequestMobileHubRail: () => jest.fn(),
  MobileHubRailProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe("AdaptiveTriplePanelLayout mobile shell", () => {
  beforeEach(() => {
    mockUseMobileHubLayout.mockReturnValue(true);
  });

  it("utilise le layout mobile quand isMobile", () => {
    render(
      <AdaptiveTriplePanelLayout
        rootTestId="adaptive-root"
        leftTestId="adaptive-left"
        centerTestId="adaptive-center"
        rightTestId="adaptive-right"
        left={<span>gauche</span>}
        center={<span>centre</span>}
        right={<span>droite</span>}
      />
    );

    expect(screen.getByTestId("adaptive-root")).toHaveClass("mobile-hub-layout");
    expect(screen.getByText("centre")).toBeInTheDocument();
  });
});

describe("AdaptiveTriplePanelLayout desktop shell", () => {
  beforeEach(() => {
    mockUseMobileHubLayout.mockReturnValue(false);
  });

  it("utilise la grille desktop 3 colonnes quand le shell est desktop", () => {
    const { container } = render(
      <AdaptiveTriplePanelLayout
        rootTestId="adaptive-desktop-root"
        leftTestId="adaptive-desktop-left"
        centerTestId="adaptive-desktop-center"
        rightTestId="adaptive-desktop-right"
        left={<span>gauche</span>}
        center={<span>centre</span>}
        right={<span>droite</span>}
      />
    );

    expect(screen.getByTestId("adaptive-desktop-root")).toBeInTheDocument();
    expect(container.querySelector(".dashboard-desktop-grid")).toBeInTheDocument();
    expect(screen.getByTestId("adaptive-desktop-left")).toBeInTheDocument();
    expect(screen.getByTestId("adaptive-desktop-center")).toBeInTheDocument();
    expect(screen.getByTestId("adaptive-desktop-right")).toBeInTheDocument();
    expect(screen.getByTestId("adaptive-desktop-root")).not.toHaveClass("mobile-hub-layout");
  });
});
