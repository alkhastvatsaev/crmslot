import React, { useRef, useState, useEffect } from "react";
import { animate, motion, useAnimation, useMotionValue, useTransform } from "framer-motion";
import { LucideIcon, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type BidirectionalSlideOutcome = "idle" | "accept" | "decline";

interface BidirectionalSlideActionProps {
  onAccept: () => void | Promise<void>;
  onDecline: () => void | Promise<void>;
  acceptLabel?: string;
  declineLabel?: string;
  className?: string;
  testId?: string;
  disabled?: boolean;
}

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
  const containerRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const [outcome, setOutcome] = useState<BidirectionalSlideOutcome>("idle");
  const [travel, setTravel] = useState(120);
  const [isActing, setIsActing] = useState(false);

  const x = useMotionValue(0);
  /** Couleur uniquement quand le curseur entre dans la zone refus / acceptation. */
  const declineFill = useTransform(x, (value) => {
    if (travel <= 0) return 0;
    if (value >= 0) return 0;
    return Math.min(1, Math.abs(value) / travel);
  });
  const acceptFill = useTransform(x, (value) => {
    if (travel <= 0) return 0;
    if (value <= 0) return 0;
    return Math.min(1, value / travel);
  });
  useEffect(() => {
    const updateTravel = () => {
      const container = containerRef.current;
      const knob = knobRef.current;
      if (!container || !knob) return;
      const max = Math.max(48, (container.offsetWidth - knob.offsetWidth) / 2 - 10);
      setTravel(max);
    };

    updateTravel();
    const container = containerRef.current;
    const ro =
      typeof ResizeObserver !== "undefined" && container
        ? new ResizeObserver(() => updateTravel())
        : null;
    if (container) ro?.observe(container);
    window.addEventListener("resize", updateTravel);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", updateTravel);
    };
  }, [disabled, testId]);

  const resetKnob = async () => {
    setOutcome("idle");
    setIsActing(false);
    await animate(x, 0, { type: "spring", stiffness: 400, damping: 30 });
  };

  const runAction = async (
    direction: "accept" | "decline",
    targetX: number,
    action: () => void | Promise<void>,
  ) => {
    setIsActing(true);
    setOutcome(direction === "accept" ? "accept" : "decline");
    await animate(x, targetX, { type: "spring", stiffness: 320, damping: 28 });
    try {
      await action();
    } catch {
      await resetKnob();
    }
  };

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: { offset: { x: number } },
  ) => {
    if (disabled || isActing || outcome !== "idle" || !containerRef.current) return;

    const delta = info.offset.x;
    const threshold = travel * 0.45;

    if (delta > threshold) {
      void runAction("accept", travel, onAccept);
      return;
    }

    if (delta < -threshold) {
      void runAction("decline", -travel, onDecline);
      return;
    }

    void resetKnob();
  };

  const knobLocked = disabled || isActing || outcome !== "idle";

  return (
    <div
      ref={containerRef}
      data-testid={testId}
      className={cn(
        "relative flex h-[58px] w-full items-center justify-center overflow-hidden rounded-full border border-neutral-200/80 bg-white",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          opacity: declineFill,
          background:
            "linear-gradient(90deg, #e11d48 0%, #fecdd3 32%, #ffffff 72%)",
        }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          opacity: acceptFill,
          background:
            "linear-gradient(270deg, #059669 0%, #a7f3d0 32%, #ffffff 72%)",
        }}
      />

      <span className="pointer-events-none absolute left-4 z-[1] text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
        {declineLabel}
      </span>
      <span className="pointer-events-none absolute right-4 z-[1] text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
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
              : "border-neutral-200 bg-neutral-900",
        )}
      >
        <span
          className={cn(
            "absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full",
            outcome === "idle" ? "bg-white" : "bg-white/90",
          )}
        />
      </motion.div>
    </div>
  );
}

interface SlideActionProps {
  onAction: () => void;
  label?: string;
  icon?: LucideIcon;
  className?: string;
  testId?: string;
  disabled?: boolean;
  variant?: "glass" | "field";
  /** Hauteur réduite (panneau technicien). */
  compact?: boolean;
}

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
  const containerRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  const [isSuccess, setIsSuccess] = useState(false);
  const [bounds, setBounds] = useState({ left: 0, right: 0 });

  const x = useMotionValue(0);
  const textOpacity = useTransform(x, [0, 150], [1, 0]);

  useEffect(() => {
    const updateBounds = () => {
      const container = containerRef.current;
      const knob = knobRef.current;
      if (!container || !knob) return;
      const right = Math.max(0, container.offsetWidth - knob.offsetWidth - 8);
      setBounds({ left: 0, right });
    };

    updateBounds();
    const container = containerRef.current;
    const ro =
      typeof ResizeObserver !== "undefined" && container
        ? new ResizeObserver(() => updateBounds())
        : null;
    if (container) ro?.observe(container);
    window.addEventListener("resize", updateBounds);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", updateBounds);
    };
  }, [label, testId, disabled, compact]);

  const trackHeight = compact ? "h-[54px]" : "h-[66px]";
  const knobSize = compact ? "h-[46px] w-[46px]" : "h-[54px] w-[54px]";
  const trackPad = compact ? "p-1" : "p-1.5";

  const handleDragEnd = async (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: { offset: { x: number } },
  ) => {
    if (disabled || !containerRef.current || !knobRef.current) return;

    const maxDrag = Math.max(bounds.right, 1);
    const dragged = Math.max(info.offset.x, x.get());

    if (dragged > maxDrag * 0.75) {
      setIsSuccess(true);
      onAction();
      void controls.start({
        x: maxDrag,
        transition: { type: "spring", stiffness: 300, damping: 25 },
      });
    } else {
      void controls.start({ x: 0, transition: { type: "spring", stiffness: 400, damping: 30 } });
    }
  };

  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        setIsSuccess(false);
        controls.start({ x: 0, transition: { type: "spring", stiffness: 300, damping: 25 } });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, controls]);

  const isField = variant === "field";

  return (
    <div
      ref={containerRef}
      data-testid={testId}
      className={cn(
        "relative flex w-full items-center overflow-hidden rounded-2xl",
        trackHeight,
        trackPad,
        isField
          ? "border border-neutral-200 bg-neutral-100"
          : "rounded-[36px] border border-white/60 bg-white/40 p-2 shadow-[0_8px_32px_rgba(0,0,0,0.06)] backdrop-blur-xl",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
    >
      {!isField ? (
        <div className="pointer-events-none absolute inset-0 rounded-[36px] bg-gradient-to-b from-white/40 to-transparent opacity-50" />
      ) : null}

      <motion.div
        style={{ opacity: textOpacity }}
        className="pointer-events-none absolute inset-0 flex items-center justify-center pl-14"
      >
        <span
          className={cn(
            "text-[13px] font-semibold tracking-wide",
            isField ? "text-neutral-500" : "text-slate-800/60 mix-blend-overlay",
          )}
        >
          {label}
        </span>
      </motion.div>

      <motion.div
        ref={knobRef}
        drag={disabled || isSuccess ? false : "x"}
        dragConstraints={bounds}
        dragElastic={0.02}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        animate={controls}
        whileTap={{ scale: 0.96 }}
        style={{ x }}
        className={cn(
          "relative z-10 flex cursor-grab items-center justify-center rounded-xl active:cursor-grabbing",
          knobSize,
          isSuccess
            ? "bg-emerald-600 text-white"
            : isField
              ? "bg-[#0F172A] text-white shadow-sm"
              : "bg-white text-slate-700 shadow-[0_4px_16px_rgba(0,0,0,0.1)]",
        )}
      >
        <Icon className="h-5 w-5" />
      </motion.div>
    </div>
  );
}
