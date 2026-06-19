"use client";

import { useTranslation } from "@/core/i18n/I18nContext";
import HubSquareGrid, { type HubSquareTileTone } from "@/core/ui/hub/HubSquareGrid";
import type { PlanningTechnicianRow } from "@/features/planningHub/planningHubTypes";

const STATUS_TONE: Record<PlanningTechnicianRow["status"], HubSquareTileTone> = {
  available: "success",
  "on-mission": "active",
  idle: "muted",
};

type Props = {
  rows: PlanningTechnicianRow[];
  loading: boolean;
  selectedUid: string | null;
  onSelect: (uid: string) => void;
};

export default function PlanningHubTechnicianGrid({ rows, loading, selectedUid, onSelect }: Props) {
  const { t } = useTranslation();

  return (
    <HubSquareGrid
      testId="planning-hub-tech-grid"
      tiles={rows.map((row) => ({
        id: row.uid,
        primary: row.name,
        secondary:
          row.missionCount > 0
            ? `${row.missionCount} ${t("planningHub.missions_today")}`
            : undefined,
        tone: STATUS_TONE[row.status],
        testId: `planning-hub-tech-${row.uid}`,
      }))}
      selectedId={selectedUid}
      onSelect={onSelect}
      loading={loading}
      emptyMessage={t("planningHub.no_technicians")}
      minSlots={12}
      size="compact"
    />
  );
}
