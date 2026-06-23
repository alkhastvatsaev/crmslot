"use client";

import { useMemo } from "react";
import { CheckCircle2, ExternalLink, Trash2, X } from "lucide-react";
import { GLASS_PANEL_BODY_SCROLL_COMPACT } from "@/core/ui/glassPanelChrome";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Intervention } from "@/features/interventions";
import {
  formatScheduledLabel,
  interventionClientLabel,
  statusLabelKey,
} from "@/features/interventions/technicianSchedule";
import { useTranslation } from "@/core/i18n/I18nContext";
import type { Technician } from "@/features/technicians";
import { useInterventionLive } from "@/features/interventions/useInterventionLive";
import { interventionBackofficeBucket } from "@/features/backoffice/backofficeBuckets";
import { buildInterventionHistory } from "@/features/backoffice/interventionHistory";

const invoiceLinkClass =
  "inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-[14px] border border-black/[0.06] bg-white/95 px-3 text-xs font-semibold text-slate-900 shadow-sm transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/15";

import { type VariantProps } from "class-variance-authority";
import { badgeVariants } from "@/components/ui/badge";
import type { BackofficeBucket } from "@/features/backoffice/backofficeBuckets";

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

function bucketBadgeVariant(bucket: BackofficeBucket): BadgeVariant {
  switch (bucket) {
    case "pending":
      return "warning";
    case "in_progress":
      return "info";
    case "done":
      return "success";
    case "invoiced":
      return "violet";
    default:
      return "secondary";
  }
}

function technicianOptionLabel(uid: string, technicians: Technician[]): string {
  const tech = technicians.find((x) => x.id === uid);
  return tech?.name?.trim() ? `${tech.name} (${uid.slice(0, 6)}…)` : uid;
}

type BackOfficeDetailDrawerProps = {
  intervention: Intervention;
  technicians: Technician[];
  isAdmin: boolean;
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
};

export default function BackOfficeDetailDrawer({
  intervention,
  technicians,
  isAdmin: _isAdmin,
  onClose,
  onDelete,
  onArchive,
}: BackOfficeDetailDrawerProps) {
  const { t } = useTranslation();
  const live = useInterventionLive(intervention.id, true);
  const merged = live ?? intervention;
  const client = interventionClientLabel(merged);
  const history = useMemo(() => buildInterventionHistory(merged), [merged]);
  const tech = (merged.assignedTechnicianUid ?? "").trim();
  const techLabel = tech ? technicianOptionLabel(tech, technicians) : "—";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="back-office-detail-title"
      data-testid="back-office-detail-drawer"
      className="absolute inset-0 z-30 flex min-h-0 flex-col rounded-[inherit] bg-[rgb(252,252,253)]/97 backdrop-blur-md"
    >
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-black/[0.06] px-4 py-3">
        <div className="min-w-0">
          <p
            id="back-office-detail-title"
            className="truncate text-[17px] font-bold text-slate-900"
          >
            {client}
          </p>
          <p className="font-mono text-[11px] font-semibold text-slate-500">
            Dossier <span className="text-slate-700">{merged.id}</span>
          </p>
        </div>
        <button
          type="button"
          data-testid="back-office-detail-close"
          aria-label="Fermer le détail"
          onClick={onClose}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white shadow-md transition hover:bg-slate-800"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <div className={cn(GLASS_PANEL_BODY_SCROLL_COMPACT, "flex flex-col gap-4 px-4 py-4")}>
        <div className="rounded-[18px] border border-black/[0.06] bg-white/90 px-4 py-4 shadow-sm">
          <h3 className="sr-only">Synthèse dossier</h3>
          <div className="grid gap-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-slate-600">État</span>
              <Badge variant={bucketBadgeVariant(interventionBackofficeBucket(merged.status))}>
                {String(t(statusLabelKey(merged.status)))}
              </Badge>
            </div>
            <div>
              <span className="font-medium text-slate-600">Tech</span>
              <p className="mt-1 font-semibold text-slate-900">{techLabel}</p>
            </div>
            <div>
              <span className="font-medium text-slate-600">Quand</span>
              <p className="mt-1 font-semibold text-slate-900">{formatScheduledLabel(merged)}</p>
            </div>
            <div>
              <span className="font-medium text-slate-600">Lieu</span>
              <p className="mt-1 leading-snug text-slate-800">{merged.address?.trim() || "—"}</p>
            </div>
            {merged.problem?.trim() ? (
              <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Problème
                </span>
                <p className="mt-1.5 font-semibold leading-snug text-slate-800">{merged.problem}</p>
              </div>
            ) : null}
            {merged.phone?.trim() ? (
              <div>
                <span className="font-medium text-slate-600">Tél.</span>
                <p className="mt-1 font-semibold text-slate-900">{merged.phone}</p>
              </div>
            ) : null}
            {merged.clientEmail?.trim() ? (
              <div>
                <span className="font-medium text-slate-600">Mail</span>
                <p className="mt-1 font-semibold text-slate-900 break-all">
                  <a href={`mailto:${merged.clientEmail}`} className="hover:underline">
                    {merged.clientEmail}
                  </a>
                </p>
              </div>
            ) : null}
            {merged.invoicePdfUrl?.trim() ? (
              <a
                href={merged.invoicePdfUrl}
                target="_blank"
                rel="noreferrer"
                data-testid="back-office-invoice-link"
                className={invoiceLinkClass}
              >
                Ouvrir la facture PDF
                <ExternalLink className="h-4 w-4" aria-hidden />
              </a>
            ) : null}
          </div>
        </div>

        <div className="rounded-[18px] border border-black/[0.06] bg-white/90 px-4 py-4 shadow-sm">
          <h3 className="sr-only">Historique</h3>
          <ul
            data-testid="back-office-history"
            className="flex flex-col gap-3"
            aria-label="Historique intervention"
          >
            {history.map((h) => (
              <li
                key={h.id}
                data-testid={`back-office-history-${h.id}`}
                className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2"
              >
                <p className="text-[13px] font-bold text-slate-900">{h.label}</p>
                {h.detail ? (
                  <p className="mt-1 font-mono text-[12px] text-slate-600">{h.detail}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex shrink-0 gap-3 border-t border-black/[0.06] bg-white/50 p-4 backdrop-blur-md">
        <button
          type="button"
          onClick={() => onDelete(merged.id)}
          className="flex-1 flex items-center justify-center gap-2 rounded-[16px] border border-red-100 bg-red-50 py-3.5 text-[14px] font-bold text-red-600 transition-all hover:bg-red-100 active:scale-95"
        >
          <Trash2 className="h-4 w-4" aria-hidden />
          {String(t("common.delete"))}
        </button>

        {merged.status !== "invoiced" && (
          <button
            type="button"
            onClick={() => onArchive(merged.id)}
            className="flex-[1.5] flex items-center justify-center gap-2 rounded-[16px] bg-emerald-600 py-3.5 text-[14px] font-bold text-white shadow-[0_8px_20px_rgba(16,185,129,0.25)] transition-all hover:bg-emerald-700 active:scale-95"
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            {String(t("backoffice.inbox.verify_report"))}
          </button>
        )}
      </div>
    </div>
  );
}
