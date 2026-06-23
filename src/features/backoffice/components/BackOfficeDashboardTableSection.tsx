"use client";

import { UserRound } from "lucide-react";
import BackOfficeInterventionsTable from "@/features/backoffice/components/BackOfficeInterventionsTable";
import type { Intervention } from "@/features/interventions";
import type { Technician } from "@/features/technicians";

type Props = {
  loading: boolean;
  tenantReady: boolean;
  rows: Intervention[];
  technicians: Technician[];
  onRowClick: (row: Intervention) => void;
  onDelete: (id: string) => void;
};

export default function BackOfficeDashboardTableSection({
  loading,
  tenantReady,
  rows,
  technicians,
  onRowClick,
  onDelete,
}: Props) {
  return (
    <div className="flex min-h-[200px] flex-1 flex-col overflow-hidden rounded-[22px] border border-black/[0.06] bg-white/90 shadow-[0_14px_36px_-18px_rgba(15,23,42,0.14)]">
      {loading && tenantReady ? (
        <div data-testid="back-office-loading" className="space-y-2 p-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-200/55" aria-hidden />
          ))}
        </div>
      ) : null}
      {!loading && tenantReady && rows.length === 0 ? (
        <div
          data-testid="back-office-empty"
          className="flex flex-1 flex-col items-center justify-center rounded-[inherit] px-5 py-8 text-center"
          aria-label="Aucune intervention"
        >
          <UserRound className="mb-1 h-12 w-12 text-slate-300" aria-hidden />
          <p className="sr-only">Aucune intervention ne correspond aux filtres.</p>
        </div>
      ) : null}
      {!loading && rows.length > 0 ? (
        <div className="min-h-0 flex-1 overflow-auto">
          <BackOfficeInterventionsTable
            rows={rows}
            technicians={technicians}
            onRowClick={onRowClick}
            onDelete={(id) => {
              void onDelete(id);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
