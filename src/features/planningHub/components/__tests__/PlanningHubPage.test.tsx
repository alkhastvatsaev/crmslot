import { render, screen, fireEvent } from "@/test-utils/render";
import PlanningHubPage from "@/features/planningHub/components/PlanningHubPage";
import { PLANNING_HUB_SLOT_INDEX } from "@/features/planningHub/planningHubConstants";
import { localCalendarYmd } from "@/features/interventions/technicianSchedule";

const today = localCalendarYmd(new Date());

jest.mock("@/context/CompanyWorkspaceContext", () => ({
  useCompanyWorkspaceOptional: () => ({
    activeCompanyId: "co-demo",
    workspaceReady: true,
  }),
}));

jest.mock("@/features/planningHub/hooks/usePlanningHubData", () => ({
  usePlanningHubData: () => ({
    interventions: [
      {
        id: "iv-plan-1",
        title: "Porte",
        address: "Rue 1",
        status: "assigned",
        time: "09:00",
        location: { lat: 0, lng: 0 },
        assignedTechnicianUid: "tech-a",
        scheduledDate: today,
        scheduledTime: "09:00",
      },
      {
        id: "iv-plan-2",
        title: "Sans tech",
        address: "Rue 2",
        status: "pending",
        time: "10:00",
        location: { lat: 0, lng: 0 },
        scheduledDate: today,
        scheduledTime: "10:00",
      },
    ],
    technicians: [
      {
        id: "t1",
        name: "Jean",
        initial: "J",
        authUid: "tech-a",
        status: "available",
        location: { lat: 0, lng: 0 },
      },
    ],
    loading: false,
  }),
}));

describe("PlanningHubPage premium patron", () => {
  it("renders technician list, slots and pending panel", () => {
    render(<PlanningHubPage slotIndex={PLANNING_HUB_SLOT_INDEX} />, { pageCount: 9 });

    expect(screen.getByTestId("planning-hub-page")).toBeInTheDocument();
    expect(screen.queryByTestId("draft-hub-banner")).not.toBeInTheDocument();
    expect(screen.queryByTestId("planning-hub-kpi-strip")).not.toBeInTheDocument();
    expect(screen.getByTestId("planning-hub-tech-tech-a")).toBeInTheDocument();
    expect(screen.getByTestId("planning-hub-slots")).toBeInTheDocument();
    expect(screen.getByTestId("planning-confirm-iv-plan-2")).toBeInTheDocument();
  });

  it("shows slot detail when a busy slot is clicked", () => {
    render(<PlanningHubPage slotIndex={PLANNING_HUB_SLOT_INDEX} />, { pageCount: 9 });

    fireEvent.click(screen.getByTestId("planning-slot-09:00"));
    expect(screen.getByTestId("planning-hub-right-mission")).toBeInTheDocument();
  });
});
