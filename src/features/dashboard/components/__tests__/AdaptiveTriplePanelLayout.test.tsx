import React from "react";
import { render, screen } from "@/test-utils/render";
import AdaptiveTriplePanelLayout from "@/features/dashboard/components/AdaptiveTriplePanelLayout";

jest.mock("@/context/LayoutShellContext", () => ({
  useMobileHubLayout: () => true,
}));

jest.mock("@/features/dashboard/MobileHubRailContext", () => ({
  useMobileHubRailRegistration: () => jest.fn(),
  useMobileHubRailSnapshot: () => null,
  useRequestMobileHubRail: () => jest.fn(),
  MobileHubRailProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe("AdaptiveTriplePanelLayout", () => {
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
