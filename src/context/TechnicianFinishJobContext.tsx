"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type FinishJobEntryStep = "photos" | "signature" | "invoice";

/** Étape courante du wizard clôture (pour verrouiller le swipe hub mobile). */
export type FinishJobWizardStep = "photos" | "signature" | "billing";

type TechnicianFinishJobApi = {
  finishJobInterventionId: string | null;
  finishJobEntryStep: FinishJobEntryStep | null;
  finishWizardStep: FinishJobWizardStep | null;
  setFinishJobInterventionId: (id: string | null) => void;
  setFinishWizardStep: (step: FinishJobWizardStep | null) => void;
  /** Ouvre le wizard clôture ; `entryStep` permet d’atterrir directement sur la facture. */
  startFinishJob: (id: string, opts?: { entryStep?: FinishJobEntryStep }) => void;
};

const TechnicianFinishJobContext = createContext<TechnicianFinishJobApi | null>(null);

type ProviderProps = {
  children: ReactNode;
  /** Tests / stories : ouvre le flux clôture avec un id d’intervention dès le montage. */
  initialFinishJobInterventionId?: string | null;
};

export function TechnicianFinishJobProvider({
  children,
  initialFinishJobInterventionId,
}: ProviderProps) {
  const [finishJobInterventionId, setFinishJobInterventionIdState] = useState<string | null>(
    initialFinishJobInterventionId !== undefined ? initialFinishJobInterventionId : null
  );
  const [finishJobEntryStep, setFinishJobEntryStep] = useState<FinishJobEntryStep | null>(null);
  const [finishWizardStep, setFinishWizardStepState] = useState<FinishJobWizardStep | null>(null);

  const setFinishJobInterventionId = useCallback((id: string | null) => {
    setFinishJobInterventionIdState(id?.trim() ? id.trim() : null);
    setFinishJobEntryStep(null);
    setFinishWizardStepState(null);
  }, []);

  const setFinishWizardStep = useCallback((step: FinishJobWizardStep | null) => {
    setFinishWizardStepState(step);
  }, []);

  const startFinishJob = useCallback((id: string, opts?: { entryStep?: FinishJobEntryStep }) => {
    const trimmed = id.trim();
    if (!trimmed) return;
    setFinishJobInterventionIdState(trimmed);
    setFinishJobEntryStep(opts?.entryStep ?? null);
  }, []);

  const value = useMemo(
    (): TechnicianFinishJobApi => ({
      finishJobInterventionId,
      finishJobEntryStep,
      finishWizardStep,
      setFinishJobInterventionId,
      setFinishWizardStep,
      startFinishJob,
    }),
    [
      finishJobInterventionId,
      finishJobEntryStep,
      finishWizardStep,
      setFinishJobInterventionId,
      setFinishWizardStep,
      startFinishJob,
    ]
  );

  return (
    <TechnicianFinishJobContext.Provider value={value}>
      {children}
    </TechnicianFinishJobContext.Provider>
  );
}

export function useTechnicianFinishJob(): TechnicianFinishJobApi {
  const ctx = useContext(TechnicianFinishJobContext);
  if (!ctx) {
    throw new Error("useTechnicianFinishJob doit être utilisé sous TechnicianFinishJobProvider.");
  }
  return ctx;
}
