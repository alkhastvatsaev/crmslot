"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CompanyStockAgentBridgeHandlers = {
  sendMessage: (text: string) => void;
  resetConversation?: () => void;
  disabled: boolean;
};

type CompanyStockAgentBridgeApi = {
  handlers: CompanyStockAgentBridgeHandlers | null;
  /** Nom client saisi dans l'agent Matériel (affichage panneau Commandes). */
  orderClientName: string;
  setOrderClientName: (name: string) => void;
  registerHandlers: (handlers: CompanyStockAgentBridgeHandlers | null) => void;
};

const CompanyStockAgentBridgeContext = createContext<CompanyStockAgentBridgeApi | null>(null);

export function CompanyStockAgentBridgeProvider({ children }: { children: ReactNode }) {
  const [handlers, setHandlers] = useState<CompanyStockAgentBridgeHandlers | null>(null);
  const [orderClientName, setOrderClientNameState] = useState("");

  const setOrderClientName = useCallback((name: string) => {
    setOrderClientNameState(name.trim());
  }, []);

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
      orderClientName,
      setOrderClientName,
      registerHandlers,
    }),
    [handlers, orderClientName, setOrderClientName, registerHandlers],
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
