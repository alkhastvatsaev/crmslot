import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SlideActionProps } from "@/components/ui/slide-action/types";
import { useSlideAction } from "@/components/ui/slide-action/useSlideAction";

export function SlideAction({
  onAction,
  label = "Glisser pour terminer",
  icon: Icon = ArrowRight,
  className,
  testId,
  disabled = false,
  variant = "field",
  compact = false,
}: SlideActionProps) {
  const {
    containerRef,
    knobRef,
    controls,
    isSuccess,
    bounds,
    x,
    textOpacity,
    premiumFillOpacity,
    handleDragEnd,
  } = useSlideAction({ onAction, label, testId, disabled, compact });

  const trackHeight = compact ? "h-[54px]" : "h-[66px]";
  const knobSize = compact ? "h-[46px] w-[46px]" : "h-[54px] w-[54px]";
  const trackPad = compact ? "p-1" : "p-1.5";
  const isField = variant === "field";
  const isPremium = variant === "premium";
  const premiumKnob = compact ? "h-[46px] w-[46px]" : "h-[50px] w-[50px]";

  return (
    <div
      ref={containerRef}
      data-testid={testId}
      className={cn(
        "relative flex w-full items-center overflow-hidden",
        isPremium ? "h-[56px] rounded-full p-1" : ["rounded-2xl", trackHeight, trackPad],
        isPremium
          ? "bg-slate-100/95 shadow-[inset_0_1px_2px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/90"
          : isField
            ? "border border-slate-200 bg-slate-100"
            : "rounded-[36px] border border-white/60 bg-white/40 p-2 shadow-[0_8px_32px_rgba(0,0,0,0.06)] backdrop-blur-xl",
        disabled && "pointer-events-none opacity-50",
        className
      )}
    >
      {!isField && !isPremium ? (
        <div className="pointer-events-none absolute inset-0 rounded-[36px] bg-gradient-to-b from-white/40 to-transparent opacity-50" />
      ) : null}

      {isPremium ? (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-y-1 left-1 rounded-full bg-gradient-to-r from-slate-900/12 via-slate-900/6 to-transparent"
          style={{ opacity: premiumFillOpacity, right: "20%" }}
        />
      ) : null}

      <motion.div
        style={{ opacity: textOpacity }}
        className={cn(
          "pointer-events-none absolute inset-0 flex items-center justify-center",
          isPremium ? "pl-[3.25rem] pr-4" : "pl-14"
        )}
      >
        <span
          className={cn(
            isPremium
              ? "text-[14px] font-medium tracking-tight text-slate-600"
              : "text-[13px] font-semibold tracking-wide",
            !isPremium && isField ? "text-slate-500" : "",
            !isPremium && !isField ? "text-slate-800/60 mix-blend-overlay" : ""
          )}
        >
          {label}
        </span>
        {isPremium && !isSuccess ? (
          <span
            aria-hidden
            className="ml-2 text-[11px] font-semibold tracking-widest text-slate-400/90"
          >
            ››
          </span>
        ) : null}
      </motion.div>

      <motion.div
        ref={knobRef}
        drag={disabled || isSuccess ? false : "x"}
        dragConstraints={bounds}
        dragElastic={isPremium ? 0.04 : 0.02}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        animate={controls}
        whileTap={{ scale: 0.96 }}
        style={{ x }}
        className={cn(
          "relative z-10 flex cursor-grab items-center justify-center active:cursor-grabbing",
          isPremium ? ["rounded-full", premiumKnob] : ["rounded-xl", knobSize],
          isSuccess
            ? "bg-emerald-600 text-white shadow-[0_8px_20px_-4px_rgba(5,150,105,0.45)]"
            : isPremium
              ? "bg-slate-900 text-white shadow-[0_10px_28px_-6px_rgba(15,23,42,0.45)] ring-2 ring-white/90"
              : isField
                ? "bg-[#0F172A] text-white shadow-sm"
                : "bg-white text-slate-700 shadow-[0_4px_16px_rgba(0,0,0,0.1)]"
        )}
      >
        <Icon
          className={cn(isPremium ? "h-[1.125rem] w-[1.125rem]" : "h-5 w-5")}
          strokeWidth={2.25}
        />
      </motion.div>
    </div>
  );
}
