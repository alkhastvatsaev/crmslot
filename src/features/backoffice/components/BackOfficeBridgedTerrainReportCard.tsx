"use client";

import { CheckCircle2, ChevronRight, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { capitalizeName } from "@/utils/stringUtils";
import { useTranslation } from "@/core/i18n/I18nContext";
import type { BridgedTechnicianReport } from "@/context/TechnicianBackofficeReportBridgeContext";
import type { Intervention } from "@/features/interventions/types";

export default function BackOfficeBridgedTerrainReportCard({
  r,
  interventions,
  onSelect,
}: {
  r: BridgedTechnicianReport;
  interventions: Intervention[];
  onSelect: (localId: string) => void;
}) {
  const { t } = useTranslation();
  const iv = interventions.find((x) => x.id === r.interventionId);
  const nameRaw =
    `${iv?.clientFirstName ?? ""} ${iv?.clientLastName ?? ""}`.trim() || (iv?.clientName ?? "");
  const displayName = nameRaw ? capitalizeName(nameRaw) : `Client · …${r.interventionId.slice(-8)}`;
  const description =
    iv?.problem ||
    iv?.title ||
    `${String(t("backoffice.inbox.terrain_report"))} (${String(t("backoffice.inbox.photos"))} + ${String(t("backoffice.inbox.signature_client"))})`;
  const addressShort = (iv?.address ?? "").split(",")[0] || (iv?.address ? iv.address : "");
  const time = new Date(r.receivedAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <motion.div
      data-testid="backoffice-bridged-report"
      onClick={() => onSelect(r.localId)}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className="group relative cursor-pointer overflow-hidden rounded-[24px] border bg-white p-4 transition-all duration-300 hover:shadow-lg border-emerald-100 bg-emerald-50/20"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <h4 className="text-[15px] font-bold text-slate-800 truncate">{displayName}</h4>
          </div>
          <p className="text-[13px] font-bold text-slate-700 truncate mb-2">{description}</p>
          <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {time}
            </span>
            {addressShort ? <span className="truncate max-w-[140px]">{addressShort}</span> : null}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-tight bg-emerald-100 text-emerald-700">
            {String(t("backoffice.inbox.tag_report"))}
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-400 transition-colors" />
        </div>
      </div>
    </motion.div>
  );
}
