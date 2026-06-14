"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { HubAgentBridgeHandlers } from "@/features/hubAgents/hubAgentTypes";

type PwaCopilotAgentBridgeApi = {
  handlers: HubAgentBridgeHandlers | null;
  registerHandlers: (handlers: HubAgentBridgeHandlers | null) => void;
};

const PwaCopilotAgentBridgeContext = createContext<PwaCopilotAgentBridgeApi | null>(null);

export function PwaCopilotAgentBridgeProvider({ children }: { children: ReactNode }) {
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
    <PwaCopilotAgentBridgeContext.Provider value={value}>
      {children}
    </PwaCopilotAgentBridgeContext.Provider>
  );
}

export function usePwaCopilotAgentBridgeOptional(): PwaCopilotAgentBridgeApi | null {
  return useContext(PwaCopilotAgentBridgeContext);
}
