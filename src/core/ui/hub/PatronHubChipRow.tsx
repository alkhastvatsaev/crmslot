"use client";

import { cn } from "@/lib/utils";

export type PatronHubChipOption = {
  id: string;
  label: string;
  testId?: string;
};

type Props = {
  value: string;
  onChange: (id: string) => void;
  options: PatronHubChipOption[];
  className?: string;
  testId?: string;
};

/** Filtres en mots simples — 2 à 3 choix max, pas de grille d’icônes. */
export default function PatronHubChipRow({
  value,
  onChange,
  options,
  className,
  testId = "patron-hub-chips",
}: Props) {
  return (
    <div
      data-testid={testId}
      className={cn("flex flex-wrap justify-center gap-2 px-3 pb-3", className)}
      role="tablist"
    >
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={active}
            data-testid={opt.testId}
            onClick={() => onChange(opt.id)}
            className={cn(
              "rounded-full px-4 py-2 text-[13px] font-semibold transition",
              active
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 ring-1 ring-black/[0.08] hover:bg-slate-50"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
