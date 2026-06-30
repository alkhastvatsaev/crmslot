import type { ReactElement } from "react";
import { fireEvent, render, screen } from "@/test-utils/render";
import { swipeLeft, swipeRight } from "@/test-utils/mobileGestures";
import MobileHubLayout from "@/features/dashboard/components/MobileHubLayout";
import MobileHubDotsBar from "@/features/dashboard/components/MobileHubDotsBar";
import {
  MobileHubRailProvider,
  useRequestMobileHubRail,
} from "@/features/dashboard/MobileHubRailContext";

function renderMobileHubLayout(ui: ReactElement) {
  return render(
    <MobileHubRailProvider>
      {ui}
      <MobileHubDotsBar />
    </MobileHubRailProvider>
  );
}

describe("MobileHubLayout", () => {
  it("affiche le rail centre par défaut (un seul rail monté)", () => {
    renderMobileHubLayout(
      <MobileHubLayout
        rootTestId="mobile-hub-root"
        leftTestId="mobile-hub-left"
        centerTestId="mobile-hub-center"
        rightTestId="mobile-hub-right"
        left={<span>gauche</span>}
        center={<span>centre</span>}
        right={<span>droite</span>}
      />
    );

    expect(screen.getByTestId("mobile-hub-root")).toBeInTheDocument();
    expect(screen.getByTestId("mobile-hub-center")).toHaveAttribute(
      "data-mobile-hub-rail-active",
      "true"
    );
    expect(screen.getByText("centre")).toBeVisible();
    expect(screen.queryByTestId("mobile-hub-left")).not.toBeInTheDocument();
    expect(screen.queryByTestId("mobile-hub-right")).not.toBeInTheDocument();
  });

  it("ne monte que le rail actif (thermique)", () => {
    renderMobileHubLayout(
      <MobileHubLayout
        leftTestId="mobile-hub-left"
        centerTestId="mobile-hub-center"
        rightTestId="mobile-hub-right"
        left={<span>gauche</span>}
        center={<span data-testid="center-marker">centre</span>}
        right={<span>droite</span>}
      />
    );

    expect(screen.getByTestId("center-marker")).toBeInTheDocument();
    expect(screen.queryByText("gauche")).not.toBeInTheDocument();
    expect(screen.queryByText("droite")).not.toBeInTheDocument();
  });

  it("affiche les dots de position quand plusieurs panneaux", () => {
    renderMobileHubLayout(
      <MobileHubLayout
        left={<span>gauche</span>}
        center={<span>centre</span>}
        right={<span>droite</span>}
      />
    );

    expect(screen.getByTestId("mobile-hub-dots-bar")).toBeInTheDocument();
    const dots = document.querySelectorAll(".mobile-hub-dot");
    expect(dots).toHaveLength(3);
    expect(document.querySelector(".mobile-hub-dot--active")).toBeInTheDocument();
  });

  it("swipe horizontal centre → droite → centre sans boucle", () => {
    renderMobileHubLayout(
      <MobileHubLayout
        rootTestId="mobile-hub-root"
        leftTestId="mobile-hub-left"
        centerTestId="mobile-hub-center"
        rightTestId="mobile-hub-right"
        left={<span>gauche</span>}
        center={<span>centre</span>}
        right={<span>droite</span>}
      />
    );

    const root = screen.getByTestId("mobile-hub-root");
    const expectActive = (testId: string) => {
      expect(screen.getByTestId(testId)).toHaveAttribute("data-mobile-hub-rail-active", "true");
    };

    expectActive("mobile-hub-center");

    swipeLeft(root);
    expectActive("mobile-hub-right");

    swipeLeft(root);
    expectActive("mobile-hub-right");

    swipeRight(root);
    expectActive("mobile-hub-center");

    swipeRight(root);
    expectActive("mobile-hub-left");

    swipeRight(root);
    expectActive("mobile-hub-left");
  });

  it("ignore swipe when swipeDisabled is true", () => {
    renderMobileHubLayout(
      <MobileHubLayout
        rootTestId="mobile-hub-root"
        leftTestId="mobile-hub-left"
        centerTestId="mobile-hub-center"
        rightTestId="mobile-hub-right"
        swipeDisabled
        left={<span>gauche</span>}
        center={<span>centre</span>}
        right={<span>droite</span>}
      />
    );

    const root = screen.getByTestId("mobile-hub-root");
    swipeLeft(root);
    expect(screen.getByTestId("mobile-hub-center")).toHaveAttribute(
      "data-mobile-hub-rail-active",
      "true"
    );
  });

  it("ouvre le rail centre via useRequestMobileHubRail (ex. clic client/mission)", () => {
    function MissionPicker() {
      const requestRail = useRequestMobileHubRail();
      return (
        <button type="button" data-testid="mock-mission-pick" onClick={() => requestRail("center")}>
          Client
        </button>
      );
    }

    renderMobileHubLayout(
      <MobileHubLayout
        mobileInitialRail="left"
        leftTestId="mobile-hub-left"
        centerTestId="mobile-hub-center"
        rightTestId="mobile-hub-right"
        left={<MissionPicker />}
        center={<span>centre</span>}
        right={<span>droite</span>}
      />
    );

    fireEvent.click(screen.getByTestId("mock-mission-pick"));
    expect(screen.getByTestId("mobile-hub-center")).toHaveAttribute(
      "data-mobile-hub-rail-active",
      "true"
    );
  });
});
