/**
 * Smoke K11 — flux technicien Kit Mission (flag ON → panneau dans le détail mission).
 */
import { render, screen } from "@testing-library/react";
import { I18nProvider } from "@/core/i18n/I18nContext";
import TechnicianDashboardDetailActive from "@/features/interventions/components/TechnicianDashboardDetailActive";
import MissionKitPanel from "@/features/missionKit/components/MissionKitPanel";
import { buildMissionKit } from "@/features/missionKit/buildMissionKit";
import type { MissionKit } from "@/features/missionKit/types";
import { makeAssignedIntervention } from "@/test-utils/factories";

const kit: MissionKit = {
  interventionId: "iv-smoke",
  generatedAt: "2026-01-01T00:00:00.000Z",
  completenessScore: 50,
  items: [
    {
      id: "cyl-euro",
      label: "Cylindre européen 30/35",
      reference: "CYL-EURO-3035",
      quantity: 1,
      source: "heuristic",
      status: "in_vehicle",
      confidence: 0.85,
    },
    {
      id: "gache-12v",
      label: "Gâche électrique 12V",
      quantity: 1,
      source: "heuristic",
      status: "missing",
      confidence: 0.7,
    },
  ],
};

jest.mock("@/core/useFeatureFlags", () => ({
  useFeatureFlag: (name: string) => name === "missionKit",
}));

jest.mock("@/features/missionKit/hooks/useMissionKit", () => ({
  useMissionKit: () => ({
    kit,
    loading: false,
    missingCount: 1,
  }),
}));

jest.mock("@/features/missionKit/hooks/useMissionKitChecklist", () => ({
  useMissionKitChecklist: () => ({
    checkedItemIds: [],
    toggleItem: jest.fn(),
  }),
}));

jest.mock("@/features/missionKit/hooks/useMissionKitMaterialOrder", () => ({
  useMissionKitMaterialOrder: () => ({
    orderItem: jest.fn(),
    orderingItemId: null,
    orderedItemIds: [],
  }),
}));

describe("Mission Kit technician flow smoke (K11)", () => {
  it("affiche mission-kit-panel dans TechnicianDashboardDetailActive", () => {
    const liveIv = makeAssignedIntervention({
      id: "iv-smoke",
      problem: "Porte claquée — cylindre européen bloqué",
      category: "serrurerie",
    });

    render(
      <I18nProvider>
        <TechnicianDashboardDetailActive
          liveIv={liveIv}
          caseId="case-smoke"
          technicianUid="tech-uid"
          clientDisplayName="Jean Dupont"
          descriptionText={liveIv.problem ?? null}
          addressMapsHref={null}
          hasAudioBlock={false}
          awaitingAssignment={false}
          showActionBar={false}
          showEarlyStartPrompt={false}
          isUpdating={false}
          primaryContactActions={[]}
          onEarlyStartConfirm={() => {}}
          onEarlyStartDismiss={() => {}}
          onUpdateStatus={async () => {}}
          onStartFinishJob={() => {}}
        />
      </I18nProvider>
    );

    expect(screen.getByTestId("mission-kit-panel")).toBeInTheDocument();
    expect(screen.getByTestId("mission-kit-item-cyl-euro")).toBeInTheDocument();
    expect(screen.getByTestId("mission-kit-item-gache-12v")).toBeInTheDocument();
  });

  it("chaîne buildMissionKit → rendu MissionKitPanel (pipeline métier)", () => {
    const built = buildMissionKit({
      interventionId: "iv-pipeline",
      problem: "Remplacement cylindre porte blindée",
      title: "Serrurerie urgente",
      category: "serrurerie",
    });

    expect(built.items.length).toBeGreaterThan(0);

    render(
      <I18nProvider>
        <MissionKitPanel kit={built} />
      </I18nProvider>
    );

    expect(screen.getByTestId("mission-kit-panel")).toBeInTheDocument();
    expect(built.items[0]?.id).toBeTruthy();
    expect(screen.getByTestId(`mission-kit-item-${built.items[0]!.id}`)).toBeInTheDocument();
  });
});
