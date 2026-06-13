import { cn } from "@/lib/utils";
import { HUB_FOCUS_RING, HUB_RADIUS } from "@/core/ui/hub/hubTheme";

export type HubButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "dangerOutline"
  | "success"
  | "accent";

type HubButtonClassOptions = {
  variant?: HubButtonVariant;
  fullWidth?: boolean;
  emphasis?: boolean;
  className?: string;
};

const variantClass: Record<HubButtonVariant, string> = {
  primary:
    "bg-slate-900 text-white hover:bg-slate-800 shadow-[0_4px_14px_-6px_rgba(15,23,42,0.35)]",
  secondary:
    "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 shadow-[0_2px_8px_-4px_rgba(15,23,42,0.08)]",
  accent: "bg-blue-600 text-white hover:bg-blue-700 shadow-[0_8px_20px_rgba(37,99,235,0.3)]",
  danger: "bg-red-600 text-white hover:bg-red-700 shadow-[0_4px_14px_-6px_rgba(220,38,38,0.35)]",
  dangerOutline:
    "border border-red-100 bg-red-50 text-red-600 hover:bg-red-100 shadow-[0_2px_8px_-4px_rgba(220,38,38,0.08)]",
  success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-[0_8px_20px_rgba(22,163,74,0.3)]",
};

export function hubButtonClassName({
  variant = "primary",
  fullWidth = false,
  emphasis = false,
  className,
}: HubButtonClassOptions = {}) {
  return cn(
    "inline-flex min-h-[44px] items-center justify-center gap-2 px-4 text-[14px] font-bold transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50",
    HUB_RADIUS.card,
    HUB_FOCUS_RING,
    variantClass[variant],
    fullWidth && "w-full",
    emphasis && "flex-[1.5]",
    !fullWidth && !emphasis && "flex-1",
    className
  );
}
