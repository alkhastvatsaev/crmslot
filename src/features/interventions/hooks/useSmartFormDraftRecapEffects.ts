"use client";

import { useEffect } from "react";
import type { WizardStep } from "@/features/interventions/smartFormTypes";

export function useSmartFormDraftRecapPhotosEffects(
  step: WizardStep,
  recapPhotosOpen: boolean,
  setRecapPhotosOpen: (open: boolean) => void
) {
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (step !== 5) setRecapPhotosOpen(false);
  }, [step, setRecapPhotosOpen]);

  useEffect(() => {
    if (!recapPhotosOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setRecapPhotosOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [recapPhotosOpen, setRecapPhotosOpen]);
}
