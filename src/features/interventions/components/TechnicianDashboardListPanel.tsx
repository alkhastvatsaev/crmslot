"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { fieldMissionStatusDotClass } from "@/core/ui/fieldMissionStatus";
import { motion } from "framer-motion";
import { GLASS_PANEL_BODY_SCROLL_COMPACT } from "@/core/ui/glassPanelChrome";
import { auth, isConfigured } from "@/core/config/firebase";
import { useTechnicianAssignments } from "@/features/interventions/useTechnicianAssignments";
import { useTechnicianMissionDayAnchor } from "@/features/interventions/useTechnicianMissionDayAnchor";
import type { Intervention } from "@/features/interventions/types";

import {
  interventionVisibleInTechnicianMissionList,
  sortInterventionsByScheduleAsc,
  formatScheduledTimeOnly,
} from "@/features/interventions/technicianSchedule";
import { isTechnicianAssignmentAwaitingResponse } from "@/features/interventions/technicianAssignmentActions";
import TechnicianAssignmentOfferCard from "@/features/interventions/components/TechnicianAssignmentOfferCard";

const outfit = { fontFamily: "'Outfit', sans-serif" } as const;

import { cn } from "@/lib/utils";
import { capitalizeName } from "@/utils/stringUtils";
import { useTranslation } from "@/core/i18n/I18nContext";

function CaseCard({
  iv,
  index,
  isSelected,
  onOpen,
  isArchived,
}: {
  iv: Intervention;
  index: number;
  isSelected: boolean;
  onOpen: () => void;
  isArchived?: boolean;
}) {
  const { t } = useTranslation();
  let firstName = iv.clientFirstName;
  let lastName = iv.clientLastName;

  if (!firstName && iv.clientName) {
    const parts = iv.clientName.trim().split(" ");
    firstName = parts[0];
    if (!lastName && parts.length > 1) {
      lastName = parts.slice(1).join(" ");
    } else if (!lastName) {
      lastName = parts[0];
    }
  }

  const displayName = [firstName, lastName].filter(Boolean).join(" ").trim();
  const displayLabel = displayName
    ? capitalizeName(displayName)
    : capitalizeName((iv.title ?? t("backoffice.dashboard.client") ?? "").toString());

  const timeLabelRaw = formatScheduledTimeOnly(iv);
  const timeLabel =
    typeof timeLabelRaw === "string" && timeLabelRaw.includes(".")
      ? String(t(timeLabelRaw))
      : timeLabelRaw;

  return (
    <motion.button
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.15, delay: index * 0.03 }}
      type="button"
      data-testid={`technician-case-${iv.id}`}
      aria-label={`${t("technician_hub.dashboard.list.dossier_aria")} ${iv.id} — ${displayLabel}`}
      onClick={onOpen}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border px-3 py-3.5 text-left transition active:scale-[0.98]",
        isArchived && "opacity-60",
        isSelected
          ? "border-neutral-900 bg-neutral-50"
          : "border-neutral-200/80 bg-white hover:bg-neutral-50",
      )}
    >
      <span className="w-11 shrink-0 text-[13px] font-bold tabular-nums text-neutral-600">{timeLabel}</span>
      <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-neutral-900">{displayLabel}</span>
      <span
        className={cn("h-2.5 w-2.5 shrink-0 rounded-full", fieldMissionStatusDotClass(iv.status))}
        aria-hidden
      />
    </motion.button>
  );
}

export default function TechnicianDashboardListPanel({
  selectedCaseId,
  onSelect,
}: {
  selectedCaseId: string | null;
  onSelect: (id: string) => void;
}) {
  const { t } = useTranslation();
  const { interventions, loading, error, firebaseUid } = useTechnicianAssignments();
  const missionDayAnchor = useTechnicianMissionDayAnchor();
  /** Replié par défaut, comme l’archive « Rapports » (page 1 / back-office). */
  const [missionsArchiveExpanded, setMissionsArchiveExpanded] = useState(false);

  const filteredSorted = useMemo(() => {
    const rows = interventions.filter((iv) =>
      interventionVisibleInTechnicianMissionList(iv, "today", firebaseUid, missionDayAnchor),
    );
    const awaiting = rows.filter((iv) =>
      isTechnicianAssignmentAwaitingResponse(iv, firebaseUid),
    );
    const rest = rows.filter(
      (iv) => !isTechnicianAssignmentAwaitingResponse(iv, firebaseUid),
    );
    return [
      ...sortInterventionsByScheduleAsc(awaiting),
      ...sortInterventionsByScheduleAsc(rest),
    ];
  }, [interventions, missionDayAnchor, firebaseUid]);

  const { activeMissions, archivedMissions } = useMemo(() => {
    const archived = filteredSorted.filter((iv) => iv.status === "done" || iv.status === "invoiced");
    const active = filteredSorted.filter((iv) => !(iv.status === "done" || iv.status === "invoiced"));
    return { activeMissions: active, archivedMissions: archived };
  }, [filteredSorted]);

  const offlineAuth = !isConfigured || !auth;

  return (
    <div
      data-testid="technician-dashboard-list"
      style={outfit}
      className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[inherit]"
      aria-label={t("technician_hub.dashboard.list.assigned_missions")}
    >
      <div
        className={`${GLASS_PANEL_BODY_SCROLL_COMPACT} flex min-h-0 flex-1 flex-col gap-1.5 px-1`}
      >
        <h2 className="sr-only">{t("technician_hub.dashboard.list.missions_title")}</h2>

        {offlineAuth ? (
          <p className="rounded-[14px] border border-amber-200/50 bg-amber-50/80 px-3 py-2 text-[12px] font-medium text-amber-950">
            {t("technician_hub.dashboard.list.offline_auth_warning")}
          </p>
        ) : null}

        {!offlineAuth && !firebaseUid ? (
          <p data-testid="technician-dashboard-login-hint" className="text-[12px] font-medium text-slate-600">
            {t("technician_hub.dashboard.list.login_prompt")}
          </p>
        ) : null}

        {error ? (
          <p
            data-testid="technician-dashboard-error"
            className="rounded-[16px] border border-rose-200/60 bg-rose-50/90 px-3 py-3 text-[13px] font-medium text-rose-900"
          >
            {error}
          </p>
        ) : null}

        <div className="flex flex-col gap-2">
          {loading && firebaseUid ? (
            <div data-testid="technician-dashboard-loading" className="space-y-4 py-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-[68px] animate-pulse rounded-[20px] bg-slate-200/55"
                  aria-hidden
                />
              ))}
            </div>
          ) : null}

          {!loading && firebaseUid && activeMissions.length === 0 && archivedMissions.length === 0 ? (
            <div
              data-testid="technician-dashboard-empty"
              className="flex flex-1 flex-col items-center justify-center rounded-[22px] border border-dashed border-black/[0.08] bg-white/60 px-5 py-8 text-center"
            >
              <p className="text-[14px] font-bold text-slate-800">{t("technician_hub.dashboard.list.no_mission")}</p>
              <p className="sr-only">{t("technician_hub.dashboard.list.no_mission_today")}</p>
            </div>
          ) : null}

          {!loading && firebaseUid && activeMissions.length > 0 ? (
            <div
              className="grid grid-cols-1 gap-1.5 pb-1"
              aria-label={t("technician_hub.dashboard.list.intervention_list")}
            >
              {activeMissions.map((iv, index) =>
                isTechnicianAssignmentAwaitingResponse(iv, firebaseUid) ? (
                  <TechnicianAssignmentOfferCard
                    key={iv.id}
                    iv={iv}
                    index={index}
                    isSelected={selectedCaseId === iv.id}
                    technicianUid={firebaseUid!}
                    onSelect={() => onSelect(iv.id)}
                  />
                ) : (
                  <CaseCard
                    key={iv.id}
                    iv={iv}
                    index={index}
                    isSelected={selectedCaseId === iv.id}
                    onOpen={() => onSelect(iv.id)}
                  />
                ),
              )}
            </div>
          ) : null}

          {!loading && firebaseUid && archivedMissions.length > 0 ? (
            <div
              className="mt-1 shrink-0 border-t border-slate-200/50 pt-1"
              data-testid="technician-dashboard-archive-section"
            >
              <button
                type="button"
                data-testid="technician-dashboard-archives-toggle"
                aria-expanded={missionsArchiveExpanded}
                onClick={() => setMissionsArchiveExpanded((v) => !v)}
                className="flex w-full items-center justify-center gap-1 rounded-[10px] py-2 px-2 text-[11px] font-medium text-slate-400 transition-colors hover:bg-slate-100/70 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300/60"
              >
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-200",
                    missionsArchiveExpanded && "rotate-180",
                  )}
                  aria-hidden
                />
                <span>
                  {String(t("technician_hub.dashboard.list.archive_word"))} · {archivedMissions.length}{" "}
                  {archivedMissions.length > 1
                    ? String(t("technician_hub.dashboard.list.archive_closed_other"))
                    : String(t("technician_hub.dashboard.list.archive_closed_one"))}
                </span>
              </button>
              {missionsArchiveExpanded ? (
                <div
                  className="grid grid-cols-1 gap-1.5 pt-2 pb-4"
                  data-testid="technician-dashboard-archives-list"
                >
                  {archivedMissions.map((iv, idx) => (
                    <CaseCard
                      key={iv.id}
                      iv={iv}
                      index={idx}
                      isSelected={selectedCaseId === iv.id}
                      onOpen={() => onSelect(iv.id)}
                      isArchived
                    />
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
