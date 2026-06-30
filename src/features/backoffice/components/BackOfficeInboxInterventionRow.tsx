"use client";

import { Clock, ChevronRight, CheckCircle2, Hourglass } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { coerceFirestoreLikeDate } from "@/features/interventions/technicianSchedule";
import { capitalizeName } from "@/utils/stringUtils";
import { guessGenderPrefixFromName } from "@/utils/genderDetection";
import { useTranslation } from "@/core/i18n/I18nContext";
import { hasPendingTechnicianReportAmendment } from "@/features/interventions/technicianInvoicedReportAmend";
import { isInterventionAwaitingTechnicianAcceptance } from "@/features/interventions/technicianSchedule";
import { useFeatureFlag } from "@/core/useFeatureFlags";
import type { Intervention } from "@/features/interventions";
import SlaBadge from "@/features/interventions/components/SlaBadge";
import SlaStatusBadge from "@/features/sla/components/SlaStatusBadge";

export type InboxInterventionRowVariant = "request" | "report-active" | "report-archived";

function formatBackofficeRowTime(value: unknown): string {
  const d = coerceFirestoreLikeDate(value);
  if (!d || Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function BackOfficeInboxInterventionRow({
  item,
  index,
  variant,
  onSelect,
}: {
  item: Intervention;
  index: number;
  variant: InboxInterventionRowVariant;
  onSelect: (id: string) => void;
}) {
  const { t } = useTranslation();
  const slaTrackerEnabled = useFeatureFlag("slaTracker");
  const isRequest = variant === "request";
  const isAwaitingTechnician =
    variant === "report-active" && isInterventionAwaitingTechnicianAcceptance(item);
  const isUrgent = item.urgency;
  const hasTechnicianAmendment = hasPendingTechnicianReportAmendment(item);

  let fName = item.clientFirstName;
  let lName = item.clientLastName;
  if (!fName && !lName && item.clientName) {
    const parts = item.clientName.trim().split(" ");
    fName = parts[0];
    lName = parts.slice(1).join(" ");
  }
  const prefix = fName ? guessGenderPrefixFromName(fName) : "";
  const displayLName = capitalizeName(lName || fName || "");
  const clientName = `${prefix} ${displayLName}`.trim() || t("backoffice.inbox.anonymous_client");

  const tagLabel = isRequest
    ? isUrgent
      ? t("backoffice.inbox.tag_urgent")
      : t("backoffice.inbox.tag_request")
    : isAwaitingTechnician
      ? t("backoffice.inbox.tag_awaiting")
      : hasTechnicianAmendment
        ? t("backoffice.inbox.tag_amended")
        : item.status === "invoiced"
          ? t("backoffice.inbox.tag_verified")
          : t("backoffice.inbox.tag_report");

  const rowTime = isRequest
    ? item.createdAt
      ? formatBackofficeRowTime(item.createdAt)
      : t("backoffice.inbox.now")
    : isAwaitingTechnician
      ? item.scheduledTime || item.requestedTime || "—"
      : item.completedAt
        ? formatBackofficeRowTime(item.completedAt)
        : "";

  return (
    <motion.div
      data-testid={
        variant === "report-archived"
          ? "backoffice-report-archived-row"
          : variant === "request"
            ? `backoffice-inbox-request-row-${item.id}`
            : variant === "report-active"
              ? `backoffice-inbox-report-row-${item.id}`
              : undefined
      }
      onClick={() => onSelect(item.id)}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-[16px] border bg-white px-3 py-2.5 shadow-[0_4px_14px_-10px_rgba(15,23,42,0.12)] transition-all duration-200 hover:shadow-[0_8px_20px_-10px_rgba(15,23,42,0.16)]",
        isRequest
          ? isUrgent
            ? "border-amber-200 bg-amber-50/30"
            : "border-slate-100"
          : variant === "report-archived"
            ? "border-slate-200/70 bg-slate-50/50 opacity-85"
            : isAwaitingTechnician
              ? "border-amber-100 bg-amber-50/30"
              : hasTechnicianAmendment
                ? "border-amber-200 bg-amber-50/30"
                : item.status === "invoiced"
                  ? "border-green-100 opacity-70"
                  : "border-blue-100"
      )}
    >
      <div className="flex items-center gap-2">
        {isRequest ? (
          <span
            className={cn(
              "flex h-1.5 w-1.5 shrink-0 rounded-full",
              isUrgent ? "bg-amber-500 animate-pulse" : "bg-blue-500"
            )}
          />
        ) : isAwaitingTechnician ? (
          <Hourglass className="h-3.5 w-3.5 shrink-0 text-amber-500" aria-hidden />
        ) : (
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" aria-hidden />
        )}
        <h4 className="min-w-0 flex-1 truncate text-[14px] font-semibold text-slate-800">
          {clientName}
        </h4>
        <span
          className={cn(
            "shrink-0 rounded-md px-1.5 py-px text-[9px] font-extrabold uppercase tracking-wide",
            isRequest
              ? isUrgent
                ? "bg-amber-100 text-amber-700"
                : "bg-blue-100 text-blue-700"
              : isAwaitingTechnician
                ? "bg-amber-100 text-amber-700"
                : hasTechnicianAmendment
                  ? "bg-amber-100 text-amber-800"
                  : item.status === "invoiced"
                    ? "bg-slate-100 text-slate-500"
                    : "bg-green-100 text-green-700"
          )}
        >
          {tagLabel}
        </span>
        <ChevronRight
          className="h-3.5 w-3.5 shrink-0 text-slate-300 transition-colors group-hover:text-slate-400"
          aria-hidden
        />
      </div>
      <p className="mt-0.5 truncate text-[12px] text-slate-500">
        {item.problem || item.title || t("backoffice.inbox.no_description")}
      </p>
      <div className="mt-0.5 flex min-w-0 items-center gap-2 text-[10px] font-medium text-slate-400">
        <span className="flex shrink-0 items-center gap-1">
          <Clock className="h-3 w-3" aria-hidden />
          {rowTime}
        </span>
        <span className="truncate">{(item.address ?? "").split(",")[0]?.trim() || "—"}</span>
        <span className="ml-auto shrink-0">
          {slaTrackerEnabled && item.priority ? (
            <SlaStatusBadge intervention={item} className="max-w-[7.5rem] truncate" />
          ) : (
            <SlaBadge intervention={item} className="max-w-[7.5rem] truncate" />
          )}
        </span>
      </div>
    </motion.div>
  );
}
