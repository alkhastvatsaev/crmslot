import { render, screen } from "@testing-library/react";
import { I18nProvider } from "@/core/i18n/I18nContext";
import MissionKitPanel from "@/features/missionKit/components/MissionKitPanel";
import type { MissionKit } from "@/features/missionKit/types";

const kit: MissionKit = {
  interventionId: "iv-1",
  generatedAt: "2026-01-01T00:00:00.000Z",
  completenessScore: 50,
  historicalHint: "Pièces facturées sur jobs similaires : Cylindre A2P",
  items: [
    {
      id: "cyl",
      label: "Cylindre européen 30/35",
      reference: "CYL-EURO-3035",
      quantity: 1,
      source: "heuristic",
      status: "in_vehicle",
      confidence: 0.8,
    },
    {
      id: "gache",
      label: "Gâche électrique 12V",
      quantity: 1,
      source: "heuristic",
      status: "missing",
      confidence: 0.7,
    },
  ],
};

describe("MissionKitPanel", () => {
  it("affiche la liste des pièces et l'historique", () => {
    render(
      <I18nProvider>
        <MissionKitPanel kit={kit} />
      </I18nProvider>
    );
    expect(screen.getByTestId("mission-kit-panel")).toBeInTheDocument();
    expect(screen.getByTestId("mission-kit-item-cyl")).toBeInTheDocument();
    expect(screen.getByTestId("mission-kit-item-gache")).toBeInTheDocument();
    expect(screen.getByText(/Cylindre européen/i)).toBeInTheDocument();
    expect(screen.getByText(/similaires/i)).toBeInTheDocument();
  });
});
