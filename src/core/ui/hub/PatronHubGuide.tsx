"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  /** Chiffre ou mot important — gros, lisible. */
  value: string;
  /** Phrase courte : ce que ça représente. */
  label: string;
  /** Ce que la personne peut faire sur cette page. */
  hint: string;
  valueTestId?: string;
  rootTestId?: string;
  footer?: ReactNode;
  className?: string;
};

/**
 * En-tête patron — une info essentielle + une action claire (style Apple UX, pas visuel).
 */
export default function PatronHubGuide({
  value,
  label,
  hint,
  valueTestId,
  rootTestId = "patron-hub-guide",
  footer,
  className,
}: Props) {
  return (
    <header
      data-testid={rootTestId}
      className={cn("flex shrink-0 flex-col gap-3 px-3 pb-2 pt-3", className)}
    >
      <div className="text-center">
        <p
          data-testid={valueTestId}
          className="text-4xl font-bold tabular-nums leading-none tracking-tight text-slate-900"
        >
          {value}
        </p>
        <p className="mt-2 text-[15px] font-medium text-slate-700">{label}</p>
      </div>
      <p className="text-center text-[13px] leading-snug text-slate-500">{hint}</p>
      {footer ? <div className="mt-1">{footer}</div> : null}
    </header>
  );
}
