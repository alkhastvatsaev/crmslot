"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const TRACKING_CASE_GRID_SLOTS = 9;

type TrackingCaseItem = {
  id: string;
  title: string;
  lastName?: string;
  statusKey: string;
  statusLabel: string;
  dateLabel: string;
  statusPillClassName: string;
};

type Props = {
  cases: TrackingCaseItem[];
  onSelect: (id: string) => void;
};

function TrackingCaseEmptySlot({ index }: { index: number }) {
  return (
    <div
      data-testid={`tracking-case-empty-slot-${index}`}
      aria-hidden
      className="h-full min-h-0 w-full rounded-[24px] border border-black/[0.06] bg-white/50 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6),0_4px_14px_-6px_rgba(15,23,42,0.08)]"
    />
  );
}

export default function RequesterTrackingCaseGrid({ cases, onSelect }: Props) {
  const gridCases = cases.slice(0, TRACKING_CASE_GRID_SLOTS);
  const trailingEmptySlots = TRACKING_CASE_GRID_SLOTS - gridCases.length;

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col px-3 pb-3 pt-2">
      <div
        data-testid="tracking-case-grid"
        className="grid h-full min-h-0 w-full flex-1 grid-cols-3 grid-rows-3 gap-3"
      >
        {gridCases.map((item, index) => (
          <motion.button
            key={item.id}
            type="button"
            data-testid={`tracking-case-card-${item.id}`}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, delay: index * 0.05 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => onSelect(item.id)}
            className="group relative flex h-full min-h-0 w-full flex-col items-center justify-between rounded-[24px] border border-black/[0.06] bg-white/95 p-3 text-center shadow-[0_6px_18px_-4px_rgba(15,23,42,0.1)] transition-all duration-200 hover:border-blue-200/80 hover:shadow-[0_4px_20px_-4px_rgba(59,130,246,0.35)]"
          >
            <div className="flex w-full flex-col items-center gap-0.5">
              {item.lastName ? (
                <span
                  data-testid={`tracking-case-lastname-${item.id}`}
                  className="line-clamp-1 text-[12px] font-semibold text-slate-600"
                >
                  {item.lastName}
                </span>
              ) : null}
              <span className="line-clamp-2 text-[14px] font-bold leading-snug tracking-tight text-slate-800">
                {item.title}
              </span>
            </div>
            <div className="flex w-full flex-col items-center gap-1.5">
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wide",
                  item.statusPillClassName
                )}
              >
                {item.statusLabel}
              </span>
              <span className="text-[11px] font-medium text-slate-400">{item.dateLabel}</span>
            </div>
          </motion.button>
        ))}
        {trailingEmptySlots > 0
          ? Array.from({ length: trailingEmptySlots }, (_, i) => (
              <TrackingCaseEmptySlot key={`empty-${i}`} index={gridCases.length + i} />
            ))
          : null}
      </div>
    </div>
  );
}
