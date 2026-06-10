import { screen } from "@testing-library/react";
import { render } from "@/test-utils/render";
import { BackOfficeInboxInterventionRow } from "@/features/backoffice/components/BackOfficeInboxInterventionRow";
import { makeIntervention } from "@/test-utils/factories";

const flagState = { slaTracker: true };

jest.mock("@/core/useFeatureFlags", () => ({
  useFeatureFlag: (key: string) => (key === "slaTracker" ? flagState.slaTracker : false),
}));

describe("BackOfficeInboxInterventionRow — SLA badge", () => {
  beforeEach(() => {
    flagState.slaTracker = true;
  });

  const oldPendingUrgent = () =>
    makeIntervention({
      id: "iv-sla-1",
      status: "pending",
      priority: "urgent",
      createdAt: new Date(Date.now() - 48 * 3_600_000).toISOString(),
    });

  it("shows priority SLA badge when slaTracker flag is on and priority set", () => {
    render(
      <BackOfficeInboxInterventionRow
        item={oldPendingUrgent()}
        index={0}
        variant="request"
        onSelect={() => {}}
      />
    );
    expect(screen.getByTestId("sla-status-badge")).toBeInTheDocument();
  });

  it("falls back to legacy badge path when flag is off", () => {
    flagState.slaTracker = false;
    render(
      <BackOfficeInboxInterventionRow
        item={oldPendingUrgent()}
        index={0}
        variant="request"
        onSelect={() => {}}
      />
    );
    expect(screen.queryByTestId("sla-status-badge")).not.toBeInTheDocument();
  });

  it("does not render priority badge without priority even with flag on", () => {
    render(
      <BackOfficeInboxInterventionRow
        item={makeIntervention({ id: "iv-sla-2", status: "pending", priority: null })}
        index={0}
        variant="request"
        onSelect={() => {}}
      />
    );
    expect(screen.queryByTestId("sla-status-badge")).not.toBeInTheDocument();
  });
});
