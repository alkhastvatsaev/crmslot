import { fireEvent, render, screen } from "@/test-utils/render";
import MobileHeaderRailLayout from "@/features/dashboard/components/MobileHeaderRailLayout";

function swipeLeft(el: HTMLElement) {
  fireEvent.touchStart(el, { touches: [{ clientX: 220, clientY: 40 }] });
  fireEvent.touchMove(el, { touches: [{ clientX: 120, clientY: 40 }] });
}

function swipeRight(el: HTMLElement) {
  fireEvent.touchStart(el, { touches: [{ clientX: 120, clientY: 40 }] });
  fireEvent.touchMove(el, { touches: [{ clientX: 220, clientY: 40 }] });
}

describe("MobileHeaderRailLayout", () => {
  it("affiche le calendrier (gauche) par défaut", () => {
    render(
      <MobileHeaderRailLayout
        rootTestId="mobile-header-rail"
        leftTestId="mobile-header-calendar"
        centerTestId="mobile-header-profile"
        left={<span>calendrier</span>}
        center={<span>profil</span>}
      />
    );

    expect(screen.getByTestId("mobile-header-calendar")).toHaveAttribute(
      "data-mobile-header-rail-active",
      "true"
    );
    expect(screen.getByTestId("mobile-header-profile")).toHaveAttribute(
      "data-mobile-header-rail-active",
      "false"
    );
  });

  it("swipe en boucle profil ↔ calendrier", () => {
    render(
      <MobileHeaderRailLayout
        rootTestId="mobile-header-rail"
        leftTestId="mobile-header-calendar"
        centerTestId="mobile-header-profile"
        left={<span>calendrier</span>}
        center={<span>profil</span>}
      />
    );

    const root = screen.getByTestId("mobile-header-rail");
    const expectActive = (testId: string) => {
      expect(screen.getByTestId(testId)).toHaveAttribute("data-mobile-header-rail-active", "true");
    };

    expectActive("mobile-header-calendar");

    swipeLeft(root);
    expectActive("mobile-header-profile");

    swipeLeft(root);
    expectActive("mobile-header-calendar");

    swipeRight(root);
    expectActive("mobile-header-profile");

    swipeRight(root);
    expectActive("mobile-header-calendar");
  });
});
