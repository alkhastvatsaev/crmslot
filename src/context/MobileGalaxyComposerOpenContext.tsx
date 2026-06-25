"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useDashboardPagerOptional } from "@/features/dashboard";
import { useMobileHubAgentRailActive } from "@/features/dashboard/hooks/useMobileFooterGalaxyVisible";
import { useRequestMobileHubRail } from "@/features/dashboard/MobileHubRailContext";
import {
  MATERIAL_AGENT_PENDING_QUICK_PROMPT_EVENT,
  peekPendingMaterialAgentQuickPrompt,
} from "@/features/featureHub";

type MobileGalaxyComposerOpenApi = {
  open: boolean;
  setOpen: (open: boolean) => void;
  requestOpen: () => void;
};

const MobileGalaxyComposerOpenContext = createContext<MobileGalaxyComposerOpenApi | null>(null);

const COMPOSER_OPEN_EVENTS = [
  "chatbot-draft-prompt",
  "chatbot-quick-prompt",
  "material-agent-draft-prompt",
  "material-agent-quick-prompt",
  "billing-agent-draft-prompt",
  "billing-agent-quick-prompt",
] as const;

/** Ouvre le dock Galaxy (saisie chatbot / dispatch) à la demande — fermé par défaut sur mobile. */
export function MobileGalaxyComposerOpenProvider({ children }: { children: ReactNode }) {
  const pager = useDashboardPagerOptional();
  const requestRail = useRequestMobileHubRail();
  const agentRailActive = useMobileHubAgentRailActive();
  const [open, setOpen] = useState(false);

  const requestOpen = useCallback(() => {
    setOpen(true);
    requestRail("left");
  }, [requestRail]);

  useEffect(() => {
    const onOpen = () => requestOpen();
    const onMaterialPending = () => {
      if (peekPendingMaterialAgentQuickPrompt()) requestOpen();
    };
    for (const name of COMPOSER_OPEN_EVENTS) {
      window.addEventListener(name, onOpen);
    }
    window.addEventListener(MATERIAL_AGENT_PENDING_QUICK_PROMPT_EVENT, onMaterialPending);
    return () => {
      for (const name of COMPOSER_OPEN_EVENTS) {
        window.removeEventListener(name, onOpen);
      }
      window.removeEventListener(MATERIAL_AGENT_PENDING_QUICK_PROMPT_EVENT, onMaterialPending);
    };
  }, [requestOpen]);

  useEffect(() => {
    setOpen(false);
  }, [pager?.pageIndex]);

  useEffect(() => {
    setOpen(agentRailActive);
  }, [agentRailActive]);

  const value = useMemo(
    () => ({
      open,
      setOpen,
      requestOpen,
    }),
    [open, requestOpen]
  );

  return (
    <MobileGalaxyComposerOpenContext.Provider value={value}>
      {children}
    </MobileGalaxyComposerOpenContext.Provider>
  );
}

export function useMobileGalaxyComposerOpenApi(): MobileGalaxyComposerOpenApi | null {
  return useContext(MobileGalaxyComposerOpenContext);
}

export function useMobileGalaxyComposerOpen(): boolean {
  return useContext(MobileGalaxyComposerOpenContext)?.open ?? false;
}
