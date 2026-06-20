"use client";

import { cn } from "@/lib/utils";

type Props = {
  step: 1 | 2 | 3;
  title: string;
  hint: string;
  className?: string;
  testId?: string;
};

export default function CaseHubStepHeader({ step, title, hint, className, testId }: Props) {
  return (
    <div
      data-testid={testId}
      className={cn(
        "flex shrink-0 flex-col gap-1 border-b border-black/[0.05] bg-white/80 px-4 py-3",
        className
      )}
    >
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
        {step} · {title}
      </p>
      <p className="text-[12px] leading-snug text-slate-600">{hint}</p>
    </div>
  );
}
