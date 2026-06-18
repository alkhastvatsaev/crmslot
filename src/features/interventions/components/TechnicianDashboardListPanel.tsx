"use client";

import { logger } from "@/core/logger";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { fieldMissionStatusDotClass } from "@/core/ui/fieldMissionStatus";
import { motion } from "framer-motion";
import { GLASS_PANEL_BODY_SCROLL_COMPACT } from "@/core/ui/glassPanelChrome";
import { HUB_FONT_OUTFIT, HUB_MISSION_CASE, HUB_RADIUS, HubCard } from "@/core/ui/hub";
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
import {
  canTechnicianReopenCompletedIntervention,
  reopenTechnicianCompletedIntervention,
  TECHNICIAN_REOPEN_I18N_KEY,
} from "@/features/interventions/technicianReopenCompletedIntervention";

import { cn } from "@/lib/utils";
import { capitalizeName } from "@/utils/stringUtils";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useTechnicianBackofficeReportBridgeOptional } from "@/context/TechnicianBackofficeReportBridgeContext";

function CaseCard({
  iv,
  index,
  isSelected,
  onOpen,
  isArchived,
  canReopen,
  reopenBusy,
  onReopen,
}: {
  iv: Intervention;
  index: number;
  isSelected: boolean;
  onOpen: () => void;
  isArchived?: boolean;
  canReopen?: boolean;
  reopenBusy?: boolean;
  onReopen?: () => void;
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
  const isCompleted = iv.status === "done" || iv.status === "invoiced";

  return (
    <div className="flex flex-col gap-1">
      <motion.button
        initial={{ opacity: 0, x: -6 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.15, delay: index * 0.03 }}
        type="button"
        data-testid={`technician-case-${iv.id}`}
        aria-label={`${t("technician_hub.dashboard.list.dossier_aria")} ${iv.id} — ${displayLabel}`}
        onClick={onOpen}
        className={cn(
          HUB_MISSION_CASE.base,
          isArchived && HUB_MISSION_CASE.archived,
          isSelected ? HUB_MISSION_CASE.selected : HUB_MISSION_CASE.default
        )}
      >
        <span
          className={cn(
            "w-11 shrink-0 text-[13px] font-bold tabular-nums",
            isCompleted ? "text-emerald-600" : "text-slate-600"
          )}
        >
          {timeLabel}
        </span>
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-[15px] font-semibold",
            isCompleted ? "text-emerald-600" : "text-slate-900"
          )}
        >
          {displayLabel}
        </span>
        <span
          className={cn("h-2.5 w-2.5 shrink-0 rounded-full", fieldMissionStatusDotClass(iv.status))}
          aria-hidden
        />
      </motion.button>
      {canReopen && onReopen ? (
        <button
          type="button"
          data-testid={`technician-case-reopen-${iv.id}`}
          disabled={reopenBusy}
          onClick={(e) => {
            e.stopPropagation();
            onReopen();
          }}
          className={cn(
            "flex w-full items-center justify-center gap-1.5 border border-dashed border-slate-300 bg-white px-2 py-2 text-[12px] font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60",
            HUB_RADIUS.control
          )}
        >
          {reopenBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : null}
          {t("technician_hub.dashboard.list.reopen_mission")}
        </button>
      ) : null}
    </div>
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
  const queryClient = useQueryClient();
  const terrainBridge = useTechnicianBackofficeReportBridgeOptional();
  const { interventions, loading, error, firebaseUid } = useTechnicianAssignments();
  const missionDayAnchor = useTechnicianMissionDayAnchor();
  const [reopeningId, setReopeningId] = useState<string | null>(null);

  const handleReopenArchived = async (iv: Intervention) => {
    const technicianUid = (firebaseUid ?? "").trim();
    const gate = canTechnicianReopenCompletedIntervention(iv, technicianUid);
    if (!gate.allowed) {
      toast.error(String(t(TECHNICIAN_REOPEN_I18N_KEY[gate.reason])));
      return;
    }
    if (!window.confirm(String(t("technician_hub.dashboard.list.reopen_confirm")))) return;

    setReopeningId(iv.id);
    try {
      await reopenTechnicianCompletedIntervention({ iv, technicianUid, queryClient });
      terrainBridge?.withdrawReportsForIntervention(iv.id);
      toast.success(String(t("technician_hub.dashboard.list.reopen_success")));
      onSelect(iv.id);
    } catch (err) {
      logger.error("reopenTechnicianCompletedIntervention", {
        error: err instanceof Error ? err.message : String(err),
      });
      const msg = err instanceof Error ? err.message : "";
      const blocked = msg.match(/^REOPEN_BLOCKED:(\w+)$/);
      if (blocked?.[1] && blocked[1] in TECHNICIAN_REOPEN_I18N_KEY) {
        toast.error(
          String(
            t(TECHNICIAN_REOPEN_I18N_KEY[blocked[1] as keyof typeof TECHNICIAN_REOPEN_I18N_KEY])
          )
        );
      } else {
        toast.error(String(t("technician_hub.dashboard.list.reopen_failed")));
      }
    } finally {
      setReopeningId(null);
    }
  };

  const filteredSorted = useMemo(() => {
    const rows = interventions.filter((iv) =>
      interventionVisibleInTechnicianMissionList(iv, "today", firebaseUid, missionDayAnchor)
    );
    return sortInterventionsByScheduleAsc(rows, missionDayAnchor);
  }, [interventions, missionDayAnchor, firebaseUid]);

  const offlineAuth = !isConfigured || !auth;

  return (
    <div
      data-testid="technician-dashboard-list"
      className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[inherit]"
      aria-label={t("technician_hub.dashboard.list.assigned_missions")}
    >
      <div
        className={`${GLASS_PANEL_BODY_SCROLL_COMPACT} flex min-h-0 flex-1 flex-col gap-1.5 px-1`}
      >
        <h2 className="sr-only">{t("technician_hub.dashboard.list.missions_title")}</h2>

        {offlineAuth ? (
          <p
            className={cn(
              "border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] font-medium text-slate-700",
              HUB_RADIUS.input
            )}
          >
            {t("technician_hub.dashboard.list.offline_auth_warning")}
          </p>
        ) : null}

        {!offlineAuth && !firebaseUid ? (
          <p
            data-testid="technician-dashboard-login-hint"
            className="text-[12px] font-medium text-slate-600"
          >
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
                  className="h-[68px] animate-pulse rounded-[16px] bg-slate-200/55"
                  aria-hidden
                />
              ))}
            </div>
          ) : null}

          {!loading && firebaseUid && filteredSorted.length === 0 ? (
            <HubCard
              data-testid="technician-dashboard-empty"
              tone="dashed"
              padding="md"
              className="flex flex-1 flex-col items-center justify-center bg-white/60 text-center"
            >
              <p className="text-[14px] font-bold text-slate-800">
                {t("technician_hub.dashboard.list.no_mission")}
              </p>
              <p className="sr-only">{t("technician_hub.dashboard.list.no_mission_today")}</p>
            </HubCard>
          ) : null}

          {!loading && firebaseUid && filteredSorted.length > 0 ? (
            <div
              className="grid grid-cols-1 gap-1.5 pb-1"
              aria-label={t("technician_hub.dashboard.list.intervention_list")}
            >
              {filteredSorted.map((iv, index) =>
                isTechnicianAssignmentAwaitingResponse(iv, firebaseUid) ? (
                  <TechnicianAssignmentOfferCard
                    key={iv.id}
                    iv={iv}
                    index={index}
                    isSelected={selectedCaseId === iv.id}
                    onSelect={() => onSelect(iv.id)}
                  />
                ) : (
                  <CaseCard
                    key={iv.id}
                    iv={iv}
                    index={index}
                    isSelected={selectedCaseId === iv.id}
                    onOpen={() => onSelect(iv.id)}
                    canReopen={canTechnicianReopenCompletedIntervention(iv, firebaseUid).allowed}
                    reopenBusy={reopeningId === iv.id}
                    onReopen={() => void handleReopenArchived(iv)}
                  />
                )
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
