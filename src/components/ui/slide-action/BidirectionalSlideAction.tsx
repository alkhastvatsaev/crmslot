import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { BidirectionalSlideActionProps } from "@/components/ui/slide-action/types";
import { useBidirectionalSlideAction } from "@/components/ui/slide-action/useBidirectionalSlideAction";

/** Curseur rond centré : glisser à droite (vert) = accepter, à gauche (rouge) = refuser. */
export function BidirectionalSlideAction({
  onAccept,
  onDecline,
  acceptLabel = "Accepter",
  declineLabel = "Refuser",
  className,
  testId,
  disabled = false,
}: BidirectionalSlideActionProps) {
  const {
    containerRef,
    knobRef,
    outcome,
    travel,
    x,
    declineFill,
    acceptFill,
    handleDragEnd,
    knobLocked,
  } = useBidirectionalSlideAction({ onAccept, onDecline, disabled, testId });

  return (
    <div
      ref={containerRef}
      data-testid={testId}
      className={cn(
        "relative flex h-[58px] w-full items-center justify-center overflow-hidden rounded-full border border-slate-200/80 bg-white",
        disabled && "pointer-events-none opacity-50",
        className
      )}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          opacity: declineFill,
          background: "linear-gradient(90deg, #e11d48 0%, #fecdd3 32%, #ffffff 72%)",
        }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          opacity: acceptFill,
          background: "linear-gradient(270deg, #059669 0%, #a7f3d0 32%, #ffffff 72%)",
        }}
      />

      <span className="pointer-events-none absolute left-4 z-[1] text-[11px] font-bold uppercase tracking-wide text-slate-400">
        {declineLabel}
      </span>
      <span className="pointer-events-none absolute right-4 z-[1] text-[11px] font-bold uppercase tracking-wide text-slate-400">
        {acceptLabel}
      </span>

      <motion.div
        ref={knobRef}
        data-testid={testId ? `${testId}-knob` : "bidirectional-slide-knob"}
        drag={knobLocked ? false : "x"}
        dragConstraints={{ left: -travel, right: travel }}
        dragElastic={0.06}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        whileTap={knobLocked ? undefined : { scale: 0.94 }}
        style={{ x }}
        className={cn(
          "relative z-10 h-[46px] w-[46px] shrink-0 cursor-grab rounded-full border-2 shadow-md active:cursor-grabbing",
          outcome === "accept"
            ? "border-emerald-700 bg-emerald-700"
            : outcome === "decline"
              ? "border-rose-600 bg-rose-600"
              : "border-slate-200 bg-slate-900"
        )}
      >
        <span
          className={cn(
            "absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full",
            outcome === "idle" ? "bg-white" : "bg-white/90"
          )}
        />
      </motion.div>
    </div>
  );
}
