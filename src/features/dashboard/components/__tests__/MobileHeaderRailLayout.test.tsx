import { render, screen } from "@/test-utils/render";
import { swipeLeft, swipeRight } from "@/test-utils/mobileGestures";
import MobileHeaderRailLayout from "@/features/dashboard/components/MobileHeaderRailLayout";

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
    expect(screen.queryByTestId("mobile-header-profile")).not.toBeInTheDocument();
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

    swipeLeft(root, 40);
    expectActive("mobile-header-profile");

    swipeLeft(root, 40);
    expectActive("mobile-header-calendar");

    swipeRight(root, 40);
    expectActive("mobile-header-profile");

    swipeRight(root, 40);
    expectActive("mobile-header-calendar");
  });

  it("ignore swipe when swipeDisabled is true", () => {
    render(
      <MobileHeaderRailLayout
        rootTestId="mobile-header-rail"
        leftTestId="mobile-header-calendar"
        centerTestId="mobile-header-profile"
        swipeDisabled
        left={<span>calendrier</span>}
        center={<span>profil</span>}
      />
    );

    const root = screen.getByTestId("mobile-header-rail");
    swipeLeft(root, 40);
    expect(screen.getByTestId("mobile-header-calendar")).toHaveAttribute(
      "data-mobile-header-rail-active",
      "true"
    );
  });
});
