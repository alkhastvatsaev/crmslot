"use client";

import type { CommissionValueType } from "@/features/commissions/types";
import type { CommissionsHubSelection } from "@/features/commissionsHub/commissionsHubTypes";
import type { PatronTechnicianRow } from "@/features/commissionsHub/commissionsHubPatronMetrics";
import CommissionsHubTechRatesList from "@/features/commissionsHub/components/CommissionsHubTechRatesList";

type Props = {
  selection: CommissionsHubSelection;
  technicianRows: PatronTechnicianRow[];
  pendingRateByUid: Record<string, number>;
  onPendingRateChange: (uid: string, value: number) => void;
  onPendingRateClear: (uid: string) => void;
  onSelectionChange: (selection: CommissionsHubSelection) => void;
  onSaveTechnicianRate: (input: {
    technicianUid: string;
    alternateTargetIds: string[];
    valueType: CommissionValueType;
    value: number;
  }) => Promise<boolean>;
};

export default function CommissionsHubRulesPanel({
  selection,
  technicianRows,
  pendingRateByUid,
  onPendingRateChange,
  onPendingRateClear,
  onSelectionChange,
  onSaveTechnicianRate,
}: Props) {
  const selectedTechUid = selection.kind === "technician" ? selection.uid : null;

  return (
    <div
      data-testid={
        selectedTechUid ? "commissions-hub-right-technician" : "commissions-hub-right-idle"
      }
      className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 py-3"
    >
      <CommissionsHubTechRatesList
        technicianRows={technicianRows}
        selectedUid={selectedTechUid}
        pendingRateByUid={pendingRateByUid}
        onPendingRateChange={onPendingRateChange}
        onPendingRateClear={onPendingRateClear}
        onSelectTech={(uid) => onSelectionChange({ kind: "technician", uid })}
        onSaveRate={(input) => onSaveTechnicianRate(input)}
      />
    </div>
  );
}
