import { fireEvent, render, screen, waitFor } from "@/test-utils/render";
import CommissionsHubTechRatesList from "@/features/commissionsHub/components/CommissionsHubTechRatesList";
import type { PatronTechnicianRow } from "@/features/commissionsHub/commissionsHubPatronMetrics";

const groupRule = {
  id: "rule-group",
  companyId: "co-1",
  isActive: true,
  level: "group" as const,
  targetId: "co-1",
  valueType: "percentage" as const,
  value: 10,
  createdAt: "",
  updatedAt: "",
  createdByUid: "admin",
};

const row: PatronTechnicianRow = {
  uid: "tech-auth-a",
  name: "Alex",
  initial: "A",
  monthEarnedCents: 5000,
  monthRevenueCents: 120_000,
  revenueMissionCount: 2,
  missionCount: 2,
  manualBonusCents: 0,
  alternateTargetIds: ["doc-a"],
  personalRule: null,
  displayRule: groupRule,
  hasPersonalRule: false,
};

const pendingProps = {
  pendingRateByUid: {} as Record<string, number>,
  onPendingRateChange: jest.fn(),
  onPendingRateClear: jest.fn(),
};

describe("CommissionsHubTechRatesList", () => {
  it("creates a personal rule when stepping from the group default", async () => {
    const onSaveRate = jest.fn().mockResolvedValue(true);

    render(
      <CommissionsHubTechRatesList
        technicianRows={[row]}
        selectedUid={null}
        onSelectTech={jest.fn()}
        onSaveRate={onSaveRate}
        {...pendingProps}
      />
    );

    fireEvent.click(screen.getByTestId("commissions-hub-tech-rate-plus-tech-auth-a"));

    await waitFor(() => expect(onSaveRate).toHaveBeenCalledTimes(1));
    expect(onSaveRate).toHaveBeenCalledWith({
      technicianUid: "tech-auth-a",
      alternateTargetIds: ["doc-a"],
      valueType: "percentage",
      value: 11,
    });
  });

  it("updates an existing personal rule id", async () => {
    const personalRule = {
      ...groupRule,
      id: "rule-personal",
      level: "technician" as const,
      targetId: "tech-auth-a",
      value: 15,
    };
    const onSaveRate = jest.fn().mockResolvedValue(true);

    render(
      <CommissionsHubTechRatesList
        technicianRows={[
          {
            ...row,
            personalRule,
            displayRule: personalRule,
            hasPersonalRule: true,
          },
        ]}
        selectedUid="tech-auth-a"
        onSelectTech={jest.fn()}
        onSaveRate={onSaveRate}
        {...pendingProps}
      />
    );

    fireEvent.click(screen.getByTestId("commissions-hub-tech-rate-plus-tech-auth-a"));

    await waitFor(() => expect(onSaveRate).toHaveBeenCalledTimes(1));
    expect(onSaveRate).toHaveBeenCalledWith({
      technicianUid: "tech-auth-a",
      alternateTargetIds: ["doc-a"],
      valueType: "percentage",
      value: 16,
    });
  });
});
