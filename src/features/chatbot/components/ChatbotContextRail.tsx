"use client";

import { motion } from "framer-motion";
import { Activity, AlertTriangle, CloudOff, Wallet } from "lucide-react";
import { useWorkspaceCopilotSnapshot } from "@/features/copilot";
import { GLASS_PANEL_BODY_SCROLL_COMPACT } from "@/core/ui/glassPanelChrome";
import { useTranslation } from "@/core/i18n/I18nContext";

function KpiCard({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: number;
  tone: "indigo" | "amber" | "rose" | "slate";
  icon: React.ReactNode;
}) {
  const tones = {
    indigo: "border-indigo-100 bg-indigo-50/60 text-indigo-900",
    amber: "border-amber-100 bg-amber-50/60 text-amber-900",
    rose: "border-rose-100 bg-rose-50/60 text-rose-900",
    slate: "border-slate-200 bg-white text-slate-800",
  };
  return (
    <div
      className={`rounded-[14px] border px-3 py-2.5 ${tones[tone]}`}
      data-testid="chatbot-kpi-card"
    >
      <motion.div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide opacity-70">
        {icon}
        {label}
      </motion.div>
      <p className="mt-1 text-2xl font-black tabular-nums">{value}</p>
    </div>
  );
}

/** Rail droit — KPI live alignés sur le tableau de bord. */
export default function ChatbotContextRail() {
  const { t } = useTranslation();
  const { snapshot, loading } = useWorkspaceCopilotSnapshot();

  if (loading && !snapshot) {
    return (
      <motion.div
        className={`${GLASS_PANEL_BODY_SCROLL_COMPACT} flex min-h-0 flex-1 flex-col gap-2 px-2 pb-4`}
        data-testid="chatbot-context-rail"
      >
        <p className="px-1 text-[11px] text-slate-400">{t("chatbot.context_loading")}</p>
      </motion.div>
    );
  }

  if (!snapshot) {
    return (
      <motion.div
        className={`${GLASS_PANEL_BODY_SCROLL_COMPACT} flex min-h-0 flex-1 flex-col gap-2 px-2 pb-4`}
        data-testid="chatbot-context-rail"
      >
        <p className="px-1 text-[12px] text-slate-500">{t("chatbot.context_no_company")}</p>
      </motion.div>
    );
  }

  const s = snapshot.summary;

  return (
    <motion.div
      className={`${GLASS_PANEL_BODY_SCROLL_COMPACT} flex min-h-0 flex-1 flex-col gap-3 px-2 pb-4`}
      data-testid="chatbot-context-rail"
    >
      <p className="px-1 text-[11px] font-black uppercase tracking-widest text-slate-400">
        Live · {snapshot.company.name ?? snapshot.company.id}
      </p>
      <div className="grid grid-cols-1 gap-2">
        <KpiCard
          label={String(t("chatbot.kpi_cases"))}
          value={s.totalInterventions}
          tone="slate"
          icon={<Activity className="h-3.5 w-3.5" />}
        />
        <KpiCard
          label={String(t("chatbot.kpi_urgent"))}
          value={s.urgentOpen}
          tone="rose"
          icon={<AlertTriangle className="h-3.5 w-3.5" />}
        />
        <KpiCard
          label={String(t("chatbot.kpi_unpaid"))}
          value={s.unpaidCount}
          tone="amber"
          icon={<Wallet className="h-3.5 w-3.5" />}
        />
        {s.pendingOfflineQueue > 0 ? (
          <KpiCard
            label={String(t("chatbot.kpi_offline"))}
            value={s.pendingOfflineQueue}
            tone="indigo"
            icon={<CloudOff className="h-3.5 w-3.5" />}
          />
        ) : null}
      </div>
      <p className="px-1 text-[11px] leading-relaxed text-slate-500">
        {t("chatbot.context_snapshot_hint")}
      </p>
    </motion.div>
  );
}
