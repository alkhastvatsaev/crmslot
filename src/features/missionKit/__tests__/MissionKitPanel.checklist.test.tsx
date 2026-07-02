import { fireEvent, render, screen } from "@testing-library/react";
import { I18nProvider } from "@/core/i18n/I18nContext";
import MissionKitPanel from "@/features/missionKit/components/MissionKitPanel";
import type { MissionKit } from "@/features/missionKit/types";

const kit: MissionKit = {
  interventionId: "iv-1",
  generatedAt: "2026-01-01T00:00:00.000Z",
  completenessScore: 0,
  items: [
    {
      id: "cyl",
      label: "Cylindre",
      quantity: 1,
      source: "heuristic",
      status: "missing",
      confidence: 0.8,
    },
  ],
};

describe("MissionKitPanel checklist", () => {
  it("appelle onToggleItem et affiche l'avertissement", () => {
    const onToggle = jest.fn();
    render(
      <I18nProvider>
        <MissionKitPanel
          kit={kit}
          interactive
          checkedItemIds={[]}
          onToggleItem={onToggle}
          showMissingWarning
        />
      </I18nProvider>
    );
    expect(screen.getByTestId("mission-kit-missing-warning")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("mission-kit-check-cyl"));
    expect(onToggle).toHaveBeenCalledWith("cyl");
  });

  it("affiche le bouton commander pour pièce manquante", () => {
    const onOrder = jest.fn();
    render(
      <I18nProvider>
        <MissionKitPanel kit={kit} onOrderItem={onOrder} />
      </I18nProvider>
    );
    fireEvent.click(screen.getByTestId("mission-kit-order-cyl"));
    expect(onOrder).toHaveBeenCalledWith(expect.objectContaining({ id: "cyl" }));
  });
});
