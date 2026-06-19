"use client";

import { cn } from "@/lib/utils";

type Tone = "revenue" | "distribution" | "rules";

const TONE_STYLES: Record<Tone, { ring: string; chip: string; text: string }> = {
  revenue: {
    ring: "ring-sky-200/80",
    chip: "bg-sky-100 text-sky-800",
    text: "text-sky-900",
  },
  distribution: {
    ring: "ring-emerald-200/80",
    chip: "bg-emerald-100 text-emerald-800",
    text: "text-emerald-900",
  },
  rules: {
    ring: "ring-violet-200/80",
    chip: "bg-violet-100 text-violet-800",
    text: "text-violet-900",
  },
};

type Props = {
  step: 1 | 2 | 3;
  verb: string;
  caption: string;
  tone: Tone;
  testId?: string;
};

/** En-tête d'étape pipeline 1→2→3. */
export default function CommissionsHubStepHeader({ step, verb, caption, tone, testId }: Props) {
  const styles = TONE_STYLES[tone];
  return (
    <div data-testid={testId} className="flex items-center gap-2.5 px-1 pb-1">
      <span
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-black ring-2",
          styles.chip,
          styles.ring
        )}
      >
        {step}
      </span>
      <div className="flex min-w-0 flex-col">
        <span className={cn("text-[10px] font-black uppercase tracking-[0.15em]", styles.text)}>
          {verb}
        </span>
        <span className="truncate text-[11px] font-medium text-slate-500">{caption}</span>
      </div>
    </div>
  );
}
