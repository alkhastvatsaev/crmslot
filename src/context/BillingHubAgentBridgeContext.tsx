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

type BillingHubAgentBridgeApi = {
  handlers: HubAgentBridgeHandlers | null;
  registerHandlers: (handlers: HubAgentBridgeHandlers | null) => void;
};

const BillingHubAgentBridgeContext = createContext<BillingHubAgentBridgeApi | null>(null);

export function BillingHubAgentBridgeProvider({ children }: { children: ReactNode }) {
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
    <BillingHubAgentBridgeContext.Provider value={value}>
      {children}
    </BillingHubAgentBridgeContext.Provider>
  );
}

export function useBillingHubAgentBridgeOptional(): BillingHubAgentBridgeApi | null {
  return useContext(BillingHubAgentBridgeContext);
}
