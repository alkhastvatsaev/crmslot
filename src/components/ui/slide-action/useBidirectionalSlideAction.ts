import { useEffect, useRef, useState } from "react";
import { animate, useMotionValue, useTransform } from "framer-motion";
import type { BidirectionalSlideOutcome } from "@/components/ui/slide-action/types";

type UseBidirectionalSlideActionParams = {
  onAccept: () => void | Promise<void>;
  onDecline: () => void | Promise<void>;
  disabled: boolean;
  testId?: string;
};

export function useBidirectionalSlideAction({
  onAccept,
  onDecline,
  disabled,
  testId,
}: UseBidirectionalSlideActionParams) {
  const containerRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const [outcome, setOutcome] = useState<BidirectionalSlideOutcome>("idle");
  const [travel, setTravel] = useState(120);
  const [isActing, setIsActing] = useState(false);

  const x = useMotionValue(0);
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
    action: () => void | Promise<void>
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
    info: { offset: { x: number } }
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

  return {
    containerRef,
    knobRef,
    outcome,
    travel,
    x,
    declineFill,
    acceptFill,
    handleDragEnd,
    knobLocked,
  };
}
