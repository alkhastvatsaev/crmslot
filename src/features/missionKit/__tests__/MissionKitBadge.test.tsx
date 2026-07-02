import { render, screen } from "@testing-library/react";
import { I18nProvider } from "@/core/i18n/I18nContext";
import MissionKitBadge from "@/features/missionKit/components/MissionKitBadge";
import type { MissionKit } from "@/features/missionKit/types";

const kit: MissionKit = {
  interventionId: "iv-1",
  generatedAt: "2026-01-01T00:00:00.000Z",
  completenessScore: 50,
  items: [
    {
      id: "a",
      label: "Cylindre",
      quantity: 1,
      source: "heuristic",
      status: "missing",
      confidence: 0.8,
    },
    {
      id: "b",
      label: "Tournevis",
      quantity: 1,
      source: "heuristic",
      status: "in_vehicle",
      confidence: 0.5,
    },
  ],
};

describe("MissionKitBadge", () => {
  it("affiche le nombre de pièces manquantes", () => {
    render(
      <I18nProvider>
        <MissionKitBadge kit={kit} />
      </I18nProvider>
    );
    expect(screen.getByTestId("mission-kit-badge")).toBeInTheDocument();
    expect(screen.getByTestId("mission-kit-badge").textContent).toMatch(
      /manquante|missing|ontbrekend/i
    );
  });
});
