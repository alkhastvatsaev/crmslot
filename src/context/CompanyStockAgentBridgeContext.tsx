"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type CompanyStockAgentBridgeHandlers = {
  sendMessage: (text: string) => void;
  resetConversation?: () => void;
  disabled: boolean;
};

type CompanyStockAgentBridgeApi = {
  handlers: CompanyStockAgentBridgeHandlers | null;
  registerHandlers: (handlers: CompanyStockAgentBridgeHandlers | null) => void;
};

const CompanyStockAgentBridgeContext = createContext<CompanyStockAgentBridgeApi | null>(null);

export function CompanyStockAgentBridgeProvider({ children }: { children: ReactNode }) {
  const [handlers, setHandlers] = useState<CompanyStockAgentBridgeHandlers | null>(null);

  const registerHandlers = useCallback((next: CompanyStockAgentBridgeHandlers | null) => {
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

  const value = useMemo(
    () => ({
      handlers,
      registerHandlers,
    }),
    [handlers, registerHandlers]
  );

  return (
    <CompanyStockAgentBridgeContext.Provider value={value}>
      {children}
    </CompanyStockAgentBridgeContext.Provider>
  );
}

export function useCompanyStockAgentBridge(): CompanyStockAgentBridgeApi {
  const ctx = useContext(CompanyStockAgentBridgeContext);
  if (!ctx) {
    throw new Error("useCompanyStockAgentBridge requires CompanyStockAgentBridgeProvider");
  }
  return ctx;
}

export function useCompanyStockAgentBridgeOptional(): CompanyStockAgentBridgeApi | null {
  return useContext(CompanyStockAgentBridgeContext);
}
