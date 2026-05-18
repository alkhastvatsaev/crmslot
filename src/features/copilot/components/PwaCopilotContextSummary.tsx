"use client";

import { useTranslation } from "@/core/i18n/I18nContext";
import type { WorkspaceCopilotSnapshot } from "@/features/copilot/types";

type Props = {
  snapshot: WorkspaceCopilotSnapshot | null;
  loading?: boolean;
};

export default function PwaCopilotContextSummary({ snapshot, loading }: Props) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <p className="text-[13px] text-slate-500" data-testid="pwa-copilot-context-loading">
        {t("copilot.loading_context")}
      </p>
    );
  }

  if (!snapshot) {
    return (
      <p className="text-[13px] text-slate-600" data-testid="pwa-copilot-context-empty">
        {t("copilot.no_company")}
      </p>
    );
  }

  const s = snapshot.summary;

  return (
    <div className="space-y-4 text-[13px] text-slate-700" data-testid="pwa-copilot-context-summary">
      <p className="font-semibold text-slate-900">{snapshot.company.name || snapshot.company.id}</p>
      <dl className="space-y-2">
        <div className="flex justify-between gap-2">
          <dt>{t("copilot.stat_total")}</dt>
          <dd className="font-bold tabular-nums text-slate-900" data-testid="pwa-copilot-stat-total">
            {s.totalInterventions}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>{t("copilot.stat_urgent")}</dt>
          <dd className="font-bold tabular-nums text-red-600">{s.urgentOpen}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>{t("copilot.stat_in_progress")}</dt>
          <dd className="font-bold tabular-nums text-slate-900">{s.inProgress}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>{t("copilot.stat_unpaid")}</dt>
          <dd className="font-bold tabular-nums text-amber-700">{s.unpaidCount}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>{t("copilot.stat_clients")}</dt>
          <dd className="font-bold tabular-nums text-slate-900">{snapshot.clients.length}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>{t("copilot.stat_offline_queue")}</dt>
          <dd className="font-bold tabular-nums text-slate-900">{s.pendingOfflineQueue}</dd>
        </div>
      </dl>
      <p className="text-[11px] text-slate-500">
        {s.navigatorOnline ? t("copilot.network_online") : t("copilot.network_offline")}
        {" · "}
        {t("copilot.snapshot_hint").replace(
          "{count}",
          String(snapshot.interventions.length),
        )}
      </p>
    </div>
  );
}
