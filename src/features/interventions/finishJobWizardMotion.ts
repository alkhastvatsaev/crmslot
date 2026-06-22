import type { FinishJobStep } from "@/features/interventions/components/FinishJobStepIndicator";

export const FINISH_JOB_STEP_VARIANTS = {
  initial: { opacity: 0, x: 16 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -16 },
};

export const FINISH_JOB_SPRING_TRANSITION = { type: "spring", bounce: 0, duration: 0.35 } as const;

export const FINISH_JOB_STEP_SHELL = "absolute inset-0 flex min-h-0 flex-col overflow-hidden px-3";

export const FINISH_JOB_DEFAULT_PHOTO_CATEGORY = "preuve" as const;

export type FinishJobWizardStep = FinishJobStep;
