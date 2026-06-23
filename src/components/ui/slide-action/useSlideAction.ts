import { useEffect, useRef, useState } from "react";
import { useAnimation, useMotionValue, useTransform } from "framer-motion";

type UseSlideActionParams = {
  onAction: () => void;
  label: string;
  testId?: string;
  disabled: boolean;
  compact: boolean;
};

export function useSlideAction({
  onAction,
  label,
  testId,
  disabled,
  compact,
}: UseSlideActionParams) {
  const containerRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  const [isSuccess, setIsSuccess] = useState(false);
  const [bounds, setBounds] = useState({ left: 0, right: 0 });

  const x = useMotionValue(0);
  const textOpacity = useTransform(x, [0, 150], [1, 0]);
  const premiumFillOpacity = useTransform(x, [0, 80, 200], [0.35, 0.55, 0.85]);

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

  const handleDragEnd = async (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: { offset: { x: number } }
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

  return {
    containerRef,
    knobRef,
    controls,
    isSuccess,
    bounds,
    x,
    textOpacity,
    premiumFillOpacity,
    handleDragEnd,
  };
}
