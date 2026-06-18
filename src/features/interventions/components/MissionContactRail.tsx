"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TERRAIN_BTN_ICON } from "@/features/interventions/terrainMobileChrome";

export type MissionContactAction = {
  key: string;
  label: string;
  testId: string;
  icon: ReactNode;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  tone?: "call" | "email" | "nav" | "sms" | "neutral";
};

const TONE_ICON_CLASS: Record<NonNullable<MissionContactAction["tone"]>, string> = {
  call: "bg-emerald-600 text-white",
  email: "bg-slate-800 text-white",
  nav: "bg-blue-600 text-white",
  sms: "bg-sky-600 text-white",
  neutral: "bg-slate-600 text-white",
};

type Props = {
  actions: MissionContactAction[];
  className?: string;
  /** Icônes seules, sans libellés visibles (terrain). */
  variant?: "default" | "compact";
};

export default function MissionContactRail({ actions, className, variant = "default" }: Props) {
  if (actions.length === 0) return null;

  const compact = variant === "compact";

  return (
    <div
      data-testid="mission-contact-rail"
      className={cn(
        "flex w-full items-center justify-center",
        compact
          ? "gap-3"
          : "gap-1 rounded-[1.25rem] bg-slate-900/[0.04] p-1.5 ring-1 ring-slate-900/[0.06]",
        className
      )}
    >
      {actions.map((action) => {
        const tone = action.tone ?? "neutral";
        const iconWrap = (
          <span
            className={cn(
              "flex items-center justify-center shadow-sm transition-transform group-active:scale-95",
              TERRAIN_BTN_ICON,
              TONE_ICON_CLASS[tone],
              compact ? "h-12 w-12" : "h-11 w-11"
            )}
          >
            {action.icon}
          </span>
        );

        const inner = compact ? (
          iconWrap
        ) : (
          <>
            {iconWrap}
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              {action.label}
            </span>
          </>
        );

        const itemClass = cn(
          "group flex flex-col items-center transition",
          compact
            ? TERRAIN_BTN_ICON
            : "min-w-0 flex-1 gap-2 rounded-xl px-1 py-2.5 hover:bg-white/90",
          action.disabled && "pointer-events-none opacity-40"
        );

        if (action.href) {
          return (
            <a
              key={action.key}
              href={action.href}
              target={action.href.startsWith("http") ? "_blank" : undefined}
              rel={action.href.startsWith("http") ? "noreferrer" : undefined}
              data-testid={action.testId}
              aria-label={action.label}
              className={itemClass}
            >
              {inner}
            </a>
          );
        }

        return (
          <button
            key={action.key}
            type="button"
            data-testid={action.testId}
            aria-label={action.label}
            disabled={action.disabled}
            onClick={action.onClick}
            className={itemClass}
          >
            {inner}
          </button>
        );
      })}
    </div>
  );
}
