"use client";

import { cn } from "@/lib/utils";
import CaseHubListPanel from "@/features/caseHub/components/CaseHubListPanel";
import type { Intervention } from "@/features/interventions/types";
import type { CaseHubBucket } from "@/features/caseHub/caseHubTypes";
import { useTranslation } from "@/core/i18n/I18nContext";

type Props = {
  interventions: Intervention[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  bucket: CaseHubBucket;
};

const BUCKET_BADGE: Record<CaseHubBucket, string> = {
  to_assign: "bg-rose-100 text-rose-800 border-rose-200",
  in_progress: "bg-violet-100 text-violet-800 border-violet-200",
  waiting: "bg-amber-100 text-amber-800 border-amber-200",
  to_invoice: "bg-emerald-100 text-emerald-800 border-emerald-200",
  invoiced: "bg-green-100 text-green-800 border-green-200",
  paid: "bg-teal-100 text-teal-800 border-teal-200",
  cancelled: "bg-slate-100 text-slate-700 border-slate-200",
  all: "bg-slate-100 text-slate-800 border-slate-200",
};

/** Step 2 — Choisir : file triée par urgence, badge du bucket actif. */
export default function CaseHubChoosePanel({
  interventions,
  loading,
  selectedId,
  onSelect,
  bucket,
}: Props) {
  const { t } = useTranslation();
  const bucketLabel = t(`caseHub.bucket.${bucket}` as "caseHub.bucket.all");

  return (
    <div
      data-testid="case-hub-choose-panel"
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-black/[0.05] bg-white/80 px-4 py-2">
        <span
          data-testid={`case-hub-active-bucket-${bucket}`}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide",
            BUCKET_BADGE[bucket]
          )}
        >
          {bucketLabel}
          <span className="rounded-full bg-white/70 px-1.5 py-px text-[10px] tabular-nums">
            {interventions.length}
          </span>
        </span>
      </div>
      <CaseHubListPanel
        interventions={interventions}
        loading={loading}
        selectedId={selectedId}
        onSelect={onSelect}
      />
    </div>
  );
}
