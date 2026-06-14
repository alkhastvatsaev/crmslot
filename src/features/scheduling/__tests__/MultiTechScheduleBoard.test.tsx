import { render, screen } from "@/test-utils/render";
import MultiTechScheduleBoard from "../components/MultiTechScheduleBoard";
import { makeIntervention } from "@/test-utils/factories";

jest.mock("@/core/useFeatureFlags", () => ({
  useFeatureFlag: (key: string) => key === "multiTechSchedule",
}));

jest.mock("@/features/technicians/hooks", () => ({
  useTechnicians: () => ({
    technicians: [{ id: "t1", name: "Jean", authUid: "tech-uid-1" }],
  }),
}));

describe("MultiTechScheduleBoard", () => {
  it("affiche la grille et les missions non assignées", () => {
    const interventions = [
      makeIntervention({ id: "iv-pending", status: "pending", assignedTechnicianUid: null }),
    ];
    render(
      <MultiTechScheduleBoard
        interventions={interventions}
        dateYmd="2026-06-10"
        onSchedule={jest.fn()}
      />
    );
    expect(screen.getByTestId("multi-tech-schedule-board")).toBeInTheDocument();
    expect(screen.getByTestId("multi-tech-unassigned")).toBeInTheDocument();
    expect(screen.getByTestId("multi-tech-drag-iv-pending")).toBeInTheDocument();
  });
});
