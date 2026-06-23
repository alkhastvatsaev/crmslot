"use client";

import type { Dispatch, SetStateAction } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BACK_OFFICE_DASHBOARD_DATE_INPUT_CLASS,
  BACK_OFFICE_DASHBOARD_SELECT_CLASS,
  backOfficeTechnicianOptionLabel,
} from "@/features/backoffice/backOfficeDashboardFormat";
import { backofficeBucketLabel } from "@/features/backoffice/backofficeBuckets";
import type { BackofficeViewFilters } from "@/features/backoffice/backofficeFilters";
import type { Technician } from "@/features/technicians";

type Membership = { companyId: string; companyName: string };

type Props = {
  filters: BackofficeViewFilters;
  setFilters: Dispatch<SetStateAction<BackofficeViewFilters>>;
  companyFilterId: string;
  setCompanyFilterId: (id: string) => void;
  memberships: Membership[];
  onActiveCompanyChange: (companyId: string) => void;
  techUids: string[];
  technicians: Technician[];
  setWindow: (window: BackofficeViewFilters["activityWindow"]) => void;
};

export default function BackOfficeDashboardFilters({
  filters,
  setFilters,
  companyFilterId,
  setCompanyFilterId,
  memberships,
  onActiveCompanyChange,
  techUids,
  technicians,
  setWindow,
}: Props) {
  return (
    <div
      className="shrink-0 rounded-[16px] border border-black/[0.06] bg-white/90 px-2 py-2 shadow-[0_14px_36px_-18px_rgba(15,23,42,0.14)]"
      aria-label="Filtres dossiers"
    >
      <h3 className="sr-only">Filtres colonnes dossiers</h3>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="back-office-filter-window" className="sr-only">
            Période
          </Label>
          <select
            id="back-office-filter-window"
            data-testid="back-office-filter-window"
            className={BACK_OFFICE_DASHBOARD_SELECT_CLASS}
            value={filters.activityWindow}
            onChange={(e) => setWindow(e.target.value as BackofficeViewFilters["activityWindow"])}
          >
            <option value="all">Dates · tout</option>
            <option value="today">Aujourd&apos;hui</option>
            <option value="week">Semaine</option>
            <option value="custom">Plage</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="back-office-filter-company" className="sr-only">
            Société
          </Label>
          <select
            id="back-office-filter-company"
            data-testid="back-office-filter-company"
            className={BACK_OFFICE_DASHBOARD_SELECT_CLASS}
            value={companyFilterId}
            onChange={(e) => {
              const id = e.target.value;
              setCompanyFilterId(id);
              onActiveCompanyChange(id);
            }}
          >
            {memberships.map((m) => (
              <option key={m.companyId} value={m.companyId}>
                {m.companyName}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="back-office-filter-tech" className="sr-only">
            Technicien
          </Label>
          <select
            id="back-office-filter-tech"
            data-testid="back-office-filter-tech"
            className={BACK_OFFICE_DASHBOARD_SELECT_CLASS}
            value={filters.technicianUid}
            onChange={(e) => setFilters((p) => ({ ...p, technicianUid: e.target.value }))}
          >
            <option value="">Techniciens · tout</option>
            {techUids.map((uid) => (
              <option key={uid} value={uid}>
                {backOfficeTechnicianOptionLabel(uid, technicians)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="back-office-filter-status" className="sr-only">
            Statut
          </Label>
          <select
            id="back-office-filter-status"
            data-testid="back-office-filter-status"
            className={BACK_OFFICE_DASHBOARD_SELECT_CLASS}
            value={filters.statusBucket}
            onChange={(e) =>
              setFilters((p) => ({
                ...p,
                statusBucket: e.target.value as BackofficeViewFilters["statusBucket"],
              }))
            }
          >
            <option value="">Statuts · tout</option>
            {(["pending", "in_progress", "done", "invoiced"] as const).map((b) => (
              <option key={b} value={b}>
                {backofficeBucketLabel(b)}
              </option>
            ))}
          </select>
        </div>
        {filters.activityWindow === "custom" ? (
          <>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="back-office-filter-from" className="sr-only">
                Du
              </Label>
              <Input
                id="back-office-filter-from"
                data-testid="back-office-filter-from"
                type="date"
                className={BACK_OFFICE_DASHBOARD_DATE_INPUT_CLASS}
                value={filters.dateFrom}
                onChange={(e) => setFilters((p) => ({ ...p, dateFrom: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="back-office-filter-to" className="sr-only">
                Au
              </Label>
              <Input
                id="back-office-filter-to"
                data-testid="back-office-filter-to"
                type="date"
                className={BACK_OFFICE_DASHBOARD_DATE_INPUT_CLASS}
                value={filters.dateTo}
                onChange={(e) => setFilters((p) => ({ ...p, dateTo: e.target.value }))}
              />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
