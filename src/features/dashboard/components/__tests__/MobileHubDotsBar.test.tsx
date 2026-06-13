import { render, screen } from "@/test-utils/render";
import MobileHubDotsBar from "@/features/dashboard/components/MobileHubDotsBar";
import {
  MobileHubRailProvider,
  useMobileHubRailRegistration,
} from "@/features/dashboard/MobileHubRailContext";
import { useEffect } from "react";

function RegisterDots({
  visible = true,
  activeRail = "center" as const,
}: {
  visible?: boolean;
  activeRail?: "left" | "center" | "right";
}) {
  const setRegistration = useMobileHubRailRegistration();

  useEffect(() => {
    setRegistration("test", {
      rails: ["left", "center", "right"],
      activeRail,
      visible,
      requestRail: () => {},
    });
    return () => setRegistration("test", null);
  }, [activeRail, setRegistration, visible]);

  return null;
}

describe("MobileHubDotsBar", () => {
  it("n'affiche rien sans enregistrement visible", () => {
    render(
      <MobileHubRailProvider>
        <MobileHubDotsBar />
      </MobileHubRailProvider>
    );

    expect(screen.queryByTestId("mobile-hub-dots-bar")).not.toBeInTheDocument();
  });

  it("affiche les dots sous le shell quand un hub multi-rails est actif", () => {
    render(
      <MobileHubRailProvider>
        <RegisterDots activeRail="right" />
        <MobileHubDotsBar />
      </MobileHubRailProvider>
    );

    expect(screen.getByTestId("mobile-hub-dots-bar")).toBeInTheDocument();
    expect(document.querySelectorAll(".mobile-hub-dot")).toHaveLength(3);
    expect(document.querySelector(".mobile-hub-dot--active")).toBeInTheDocument();
  });
});
