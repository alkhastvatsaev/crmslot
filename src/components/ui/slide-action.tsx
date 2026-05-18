import React, { useRef, useState, useEffect } from "react";
import { motion, useAnimation, useMotionValue, useTransform } from "framer-motion";
import { LucideIcon, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SlideActionProps {
  onAction: () => void;
  label?: string;
  icon?: LucideIcon;
  className?: string;
  testId?: string;
  disabled?: boolean;
  variant?: "glass" | "field";
}

export function SlideAction({
  onAction,
  label = "Glisser pour terminer",
  icon: Icon = ArrowRight,
  className,
  testId,
  disabled = false,
  variant = "field",
}: SlideActionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  const [isSuccess, setIsSuccess] = useState(false);
  const [bounds, setBounds] = useState({ left: 0, right: 0 });

  const x = useMotionValue(0);
  const textOpacity = useTransform(x, [0, 150], [1, 0]);

  useEffect(() => {
    if (containerRef.current && knobRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const knobWidth = knobRef.current.offsetWidth;
      setBounds({ left: 0, right: containerWidth - knobWidth - 8 });
    }
  }, []);

  const handleDragEnd = async (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: { offset: { x: number } },
  ) => {
    if (disabled || !containerRef.current || !knobRef.current) return;

    const maxDrag = bounds.right;

    if (info.offset.x > maxDrag * 0.75) {
      setIsSuccess(true);
      await controls.start({
        x: maxDrag,
        transition: { type: "spring", stiffness: 300, damping: 25 },
      });
      onAction();
    } else {
      controls.start({ x: 0, transition: { type: "spring", stiffness: 400, damping: 30 } });
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
        "relative flex h-[66px] w-full items-center overflow-hidden rounded-2xl p-1.5",
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
          "relative z-10 flex h-[54px] w-[54px] cursor-grab items-center justify-center rounded-xl active:cursor-grabbing",
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
