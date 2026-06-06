"use client";

import { Clock, ChevronRight, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { coerceFirestoreLikeDate } from "@/features/interventions/technicianSchedule";
import { capitalizeName } from "@/utils/stringUtils";
import { guessGenderPrefixFromName } from "@/utils/genderDetection";
import { useTranslation } from "@/core/i18n/I18nContext";
import type { Intervention } from "@/features/interventions/types";
import SlaBadge from "@/features/interventions/components/SlaBadge";

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
  const isRequest = variant === "request";
  const isUrgent = item.urgency;

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
        "group relative cursor-pointer overflow-hidden rounded-[24px] border bg-white p-4 transition-all duration-300 hover:shadow-lg",
        isRequest
          ? isUrgent
            ? "border-amber-200 bg-amber-50/30"
            : "border-slate-100"
          : variant === "report-archived"
            ? "border-slate-200/70 bg-slate-50/50 opacity-85"
            : item.status === "invoiced"
              ? "border-green-100 opacity-70"
              : "border-blue-100"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {isRequest ? (
              <span
                className={cn(
                  "flex h-2 w-2 rounded-full",
                  isUrgent ? "bg-amber-500 animate-pulse" : "bg-blue-500"
                )}
              />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            )}
            <h4 className="text-[15px] font-bold text-slate-800 truncate">{clientName}</h4>
            <SlaBadge intervention={item} />
          </div>
          <p className="text-[13px] text-slate-500 truncate mb-2">
            {item.problem || item.title || t("backoffice.inbox.no_description")}
          </p>
          <div className="flex items-center gap-3 text-[11px] font-medium text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {isRequest
                ? item.createdAt
                  ? formatBackofficeRowTime(item.createdAt)
                  : t("backoffice.inbox.now")
                : item.completedAt
                  ? formatBackofficeRowTime(item.completedAt)
                  : ""}
            </span>
            <span className="truncate max-w-[120px]">
              {(item.address ?? "").split(",")[0]?.trim() || "—"}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div
            className={cn(
              "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-tight",
              isRequest
                ? isUrgent
                  ? "bg-amber-100 text-amber-700"
                  : "bg-blue-100 text-blue-700"
                : item.status === "invoiced"
                  ? "bg-slate-100 text-slate-500"
                  : "bg-green-100 text-green-700"
            )}
          >
            {isRequest
              ? isUrgent
                ? t("backoffice.inbox.tag_urgent")
                : t("backoffice.inbox.tag_request")
              : item.status === "invoiced"
                ? t("backoffice.inbox.tag_verified")
                : t("backoffice.inbox.tag_report")}
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-400 transition-colors" />
        </div>
      </div>
    </motion.div>
  );
}
