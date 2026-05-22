"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { HubAgentBridgeHandlers } from "@/features/hubAgents/hubAgentTypes";

type CrmHistoryAgentBridgeApi = {
  handlers: HubAgentBridgeHandlers | null;
  registerHandlers: (handlers: HubAgentBridgeHandlers | null) => void;
};

const CrmHistoryAgentBridgeContext = createContext<CrmHistoryAgentBridgeApi | null>(null);

export function CrmHistoryAgentBridgeProvider({ children }: { children: ReactNode }) {
  const [handlers, setHandlers] = useState<HubAgentBridgeHandlers | null>(null);

  const registerHandlers = useCallback((next: HubAgentBridgeHandlers | null) => {
    setHandlers((prev) => {
      if (prev === next) return prev;
      if (
        prev &&
        next &&
        prev.disabled === next.disabled &&
        prev.sendMessage === next.sendMessage &&
        prev.resetConversation === next.resetConversation
      ) {
        return prev;
      }
      return next;
    });
  }, []);

  const value = useMemo(() => ({ handlers, registerHandlers }), [handlers, registerHandlers]);

  return (
    <CrmHistoryAgentBridgeContext.Provider value={value}>{children}</CrmHistoryAgentBridgeContext.Provider>
  );
}

export function useCrmHistoryAgentBridgeOptional(): CrmHistoryAgentBridgeApi | null {
  return useContext(CrmHistoryAgentBridgeContext);
}
