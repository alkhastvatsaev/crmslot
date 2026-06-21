"use client";

import { AlertTriangle, Banknote, CheckCircle2, Clock, List, Truck, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import type { CaseHubBucket } from "@/features/caseHub/caseHubTypes";

type Props = {
  bucket: CaseHubBucket;
  onBucketChange: (bucket: CaseHubBucket) => void;
  counts: Record<CaseHubBucket, number>;
};

type BucketMeta = {
  id: CaseHubBucket;
  icon: typeof List;
  testId: string;
  tone: { ring: string; iconBg: string; text: string; activeBg: string };
  urgent?: boolean;
};

const BUCKET_META: BucketMeta[] = [
  {
    id: "to_assign",
    icon: AlertTriangle,
    testId: "case-hub-bucket-to-assign",
    tone: {
      ring: "border-rose-200 bg-rose-50/70",
      iconBg: "bg-rose-100 text-rose-700",
      text: "text-rose-900",
      activeBg: "bg-rose-600 text-white border-rose-600",
    },
    urgent: true,
  },
  {
    id: "in_progress",
    icon: Truck,
    testId: "case-hub-bucket-in-progress",
    tone: {
      ring: "border-violet-200 bg-violet-50/70",
      iconBg: "bg-violet-100 text-violet-700",
      text: "text-violet-900",
      activeBg: "bg-violet-600 text-white border-violet-600",
    },
  },
  {
    id: "waiting",
    icon: Clock,
    testId: "case-hub-bucket-waiting",
    tone: {
      ring: "border-amber-200 bg-amber-50/70",
      iconBg: "bg-amber-100 text-amber-800",
      text: "text-amber-900",
      activeBg: "bg-amber-600 text-white border-amber-600",
    },
  },
  {
    id: "to_invoice",
    icon: Banknote,
    testId: "case-hub-bucket-to-invoice",
    tone: {
      ring: "border-emerald-200 bg-emerald-50/70",
      iconBg: "bg-emerald-100 text-emerald-800",
      text: "text-emerald-900",
      activeBg: "bg-emerald-600 text-white border-emerald-600",
    },
    urgent: true,
  },
  {
    id: "invoiced",
    icon: CheckCircle2,
    testId: "case-hub-bucket-invoiced",
    tone: {
      ring: "border-green-200 bg-green-50/50",
      iconBg: "bg-green-100 text-green-700",
      text: "text-green-900",
      activeBg: "bg-green-700 text-white border-green-700",
    },
  },
  {
    id: "cancelled",
    icon: XCircle,
    testId: "case-hub-bucket-cancelled",
    tone: {
      ring: "border-slate-200 bg-slate-50/60",
      iconBg: "bg-slate-100 text-slate-600",
      text: "text-slate-700",
      activeBg: "bg-slate-700 text-white border-slate-700",
    },
  },
  {
    id: "all",
    icon: List,
    testId: "case-hub-bucket-all",
    tone: {
      ring: "border-slate-200 bg-white/80",
      iconBg: "bg-slate-100 text-slate-600",
      text: "text-slate-700",
      activeBg: "bg-slate-900 text-white border-slate-900",
    },
  },
];

export default function CaseHubLeftRail({ bucket, onBucketChange, counts }: Props) {
  const { t } = useTranslation();

  return (
    <div
      data-testid="case-hub-left-rail"
      className="custom-scrollbar flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3"
    >
      <div className="flex flex-col gap-1.5">
        {BUCKET_META.map(({ id, icon: Icon, testId, tone, urgent }) => {
          const active = bucket === id;
          const count = counts[id];
          const empty = count === 0;
          return (
            <button
              key={id}
              type="button"
              data-testid={testId}
              onClick={() => onBucketChange(id)}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition active:scale-[0.99]",
                active ? tone.activeBg : `${tone.ring} hover:scale-[1.01]`,
                empty && !active && "opacity-50"
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base",
                  active ? "bg-white/20 text-white" : tone.iconBg
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span
                  className={cn(
                    "truncate text-[13px] font-bold",
                    active ? "text-white" : tone.text
                  )}
                >
                  {t(`caseHub.bucket.${id}` as "caseHub.bucket.all")}
                </span>
                <span
                  className={cn(
                    "truncate text-[10px] font-medium",
                    active ? "text-white/80" : "text-slate-500"
                  )}
                >
                  {t(`caseHub.bucket_hint.${id}` as "caseHub.bucket_hint.all")}
                </span>
              </span>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-0.5 text-sm font-black tabular-nums",
                  active
                    ? "bg-white/20 text-white"
                    : urgent && count > 0
                      ? `${tone.iconBg} ring-2 ring-white`
                      : "bg-white text-slate-700"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
