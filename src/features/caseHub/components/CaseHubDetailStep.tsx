"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { CASE_HUB_DETAIL } from "@/features/caseHub/caseHubDetailTheme";

type Props = {
  step: 1 | 2 | 3 | 4 | 5;
  title: string;
  children: ReactNode;
  testId?: string;
  className?: string;
};

/** En-tête d'étape numérotée — pipeline panel droit dossiers. */
export default function CaseHubDetailStep({ step, title, children, testId, className }: Props) {
  return (
    <section
      data-testid={testId}
      className={cn(CASE_HUB_DETAIL.stepSection, className)}
      aria-labelledby={`case-hub-step-${step}-title`}
    >
      <header className={CASE_HUB_DETAIL.stepHeader}>
        <span className={CASE_HUB_DETAIL.stepNumber}>{step}</span>
        <h3 id={`case-hub-step-${step}-title`} className={CASE_HUB_DETAIL.stepTitle}>
          {title}
        </h3>
      </header>
      <div className={CASE_HUB_DETAIL.stepBody}>{children}</div>
    </section>
  );
}
