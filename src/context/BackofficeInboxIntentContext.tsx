"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type BackofficeInboxIntentApi = {
  pendingInboxId: string | null;
  setPendingInboxId: (id: string | null) => void;
  /** Dossier sélectionné dans l’inbox Demandes (partagé avec la page 4). */
  selectedInboxInterventionId: string | null;
  setSelectedInboxInterventionId: (id: string | null) => void;
  /** Ouvre l’onglet chat sur un dossier (ex. clic mission rail gauche). */
  pendingChatInterventionId: string | null;
  setPendingChatInterventionId: (id: string | null) => void;
  /** Onglet actif inbox carte (mobile : gating Firestore). */
  activeInboxTab: "chat" | "requests" | "reports" | null;
  setActiveInboxTab: (tab: "chat" | "requests" | "reports" | null) => void;
};

const BackofficeInboxIntentContext = createContext<BackofficeInboxIntentApi | null>(null);

export function BackofficeInboxIntentProvider({ children }: { children: ReactNode }) {
  const [pendingInboxId, setPendingInboxIdState] = useState<string | null>(null);
  const [selectedInboxInterventionId, setSelectedInboxInterventionIdState] = useState<
    string | null
  >(null);
  const [pendingChatInterventionId, setPendingChatInterventionIdState] = useState<string | null>(
    null
  );
  const [activeInboxTab, setActiveInboxTabState] = useState<"chat" | "requests" | "reports" | null>(
    null
  );

  const setPendingInboxId = useCallback((id: string | null) => {
    setPendingInboxIdState(id?.trim() ? id.trim() : null);
  }, []);

  const setSelectedInboxInterventionId = useCallback((id: string | null) => {
    setSelectedInboxInterventionIdState(id?.trim() ? id.trim() : null);
  }, []);

  const setPendingChatInterventionId = useCallback((id: string | null) => {
    setPendingChatInterventionIdState(id?.trim() ? id.trim() : null);
  }, []);

  const setActiveInboxTab = useCallback((tab: "chat" | "requests" | "reports" | null) => {
    setActiveInboxTabState(tab);
  }, []);

  const value = useMemo(
    () => ({
      pendingInboxId,
      setPendingInboxId,
      selectedInboxInterventionId,
      setSelectedInboxInterventionId,
      pendingChatInterventionId,
      setPendingChatInterventionId,
      activeInboxTab,
      setActiveInboxTab,
    }),
    [
      pendingInboxId,
      setPendingInboxId,
      selectedInboxInterventionId,
      setSelectedInboxInterventionId,
      pendingChatInterventionId,
      setPendingChatInterventionId,
      activeInboxTab,
      setActiveInboxTab,
    ]
  );

  return (
    <BackofficeInboxIntentContext.Provider value={value}>
      {children}
    </BackofficeInboxIntentContext.Provider>
  );
}

export function useBackofficeInboxIntent(): BackofficeInboxIntentApi {
  const ctx = useContext(BackofficeInboxIntentContext);
  if (!ctx) {
    throw new Error(
      "useBackofficeInboxIntent doit être utilisé sous BackofficeInboxIntentProvider."
    );
  }
  return ctx;
}

export function useBackofficeInboxIntentOptional(): BackofficeInboxIntentApi | null {
  return useContext(BackofficeInboxIntentContext);
}
