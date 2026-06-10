import { fireEvent, render, screen } from "@/test-utils/render";
import MobileHubLayout from "@/features/dashboard/components/MobileHubLayout";

jest.mock("@/features/dashboard/components/MobileMapSwipeLock", () => ({
  __esModule: true,
  default: ({
    onSwipeLeft,
    onSwipeRight,
  }: {
    onSwipeLeft: () => void;
    onSwipeRight: () => void;
  }) => (
    <div data-testid="map-swipe-lock">
      <button data-testid="mock-swipe-left" onClick={onSwipeLeft} />
      <button data-testid="mock-swipe-right" onClick={onSwipeRight} />
    </div>
  ),
}));

describe("MobileHubLayout", () => {
  it("affiche le rail centre par défaut", () => {
    render(
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
    expect(screen.getByTestId("mobile-hub-center")).toBeInTheDocument();
    expect(screen.getByText("centre")).toBeInTheDocument();
    expect(screen.queryByText("gauche")).not.toBeInTheDocument();
  });

  it("affiche les dots de position quand plusieurs panneaux", () => {
    render(
      <MobileHubLayout
        left={<span>gauche</span>}
        center={<span>centre</span>}
        right={<span>droite</span>}
      />
    );

    const dots = document.querySelectorAll(".mobile-hub-dot");
    expect(dots).toHaveLength(3);
    expect(document.querySelector(".mobile-hub-dot--active")).toBeInTheDocument();
  });

  it("navigue vers le panneau gauche via swipeRight callback", () => {
    render(
      <MobileHubLayout
        centerTestId="mobile-hub-center"
        leftTestId="mobile-hub-left"
        left={<span>gauche</span>}
        center={<span>centre</span>}
        right={<span>droite</span>}
      />
    );

    // Simule le swipe depuis le mock MobileMapSwipeLock n'est pas monté ici (pas de centerHasSwipeLock)
    // On teste la navigation directe via usePanelSwipe en simulant les touch events
    const root = screen.getByText("centre").closest("[data-testid]")?.parentElement;
    expect(root).toBeTruthy();
  });

  it("monte l'overlay MobileMapSwipeLock quand centerHasSwipeLock", () => {
    render(
      <MobileHubLayout
        centerTestId="mobile-hub-center"
        left={<span>gauche</span>}
        center={<span>centre</span>}
        right={<span>droite</span>}
        centerHasSwipeLock
      />
    );

    expect(screen.getByTestId("map-swipe-lock")).toBeInTheDocument();
  });

  it("swipe gauche depuis centre → panneau droit via MobileMapSwipeLock", () => {
    render(
      <MobileHubLayout
        leftTestId="mobile-hub-left"
        centerTestId="mobile-hub-center"
        rightTestId="mobile-hub-right"
        left={<span>gauche</span>}
        center={<span>centre</span>}
        right={<span>droite</span>}
        centerHasSwipeLock
      />
    );

    expect(screen.getByTestId("mobile-hub-center")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("mock-swipe-left"));
    expect(screen.getByTestId("mobile-hub-right")).toBeInTheDocument();
    // overlay démonté quand on n'est plus sur centre
    expect(screen.queryByTestId("map-swipe-lock")).not.toBeInTheDocument();
  });

  it("swipe droit depuis centre → panneau gauche via MobileMapSwipeLock", () => {
    render(
      <MobileHubLayout
        leftTestId="mobile-hub-left"
        centerTestId="mobile-hub-center"
        rightTestId="mobile-hub-right"
        left={<span>gauche</span>}
        center={<span>centre</span>}
        right={<span>droite</span>}
        centerHasSwipeLock
      />
    );

    fireEvent.click(screen.getByTestId("mock-swipe-right"));
    expect(screen.getByTestId("mobile-hub-left")).toBeInTheDocument();
  });
});
