"use client";

import { useCallback, useRef, useState } from "react";
import { runCompanyStockAgentTurn } from "@/features/featureHub/companyStockAgent";
import type {
  CompanyStockAgentAction,
  CompanyStockAgentContext,
  CompanyStockAgentMessage,
} from "@/features/featureHub/companyStockAgentTypes";

function nextId(): string {
  return `stock-agent-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

type Options = {
  enabled?: boolean;
  onAction?: (action: CompanyStockAgentAction) => void;
};

export function useCompanyStockAgent(ctx: CompanyStockAgentContext, options?: Options) {
  const enabled = options?.enabled !== false && Boolean(ctx.companyId);
  const [messages, setMessages] = useState<CompanyStockAgentMessage[]>([]);
  const [thinking, setThinking] = useState(false);
  const bootedRef = useRef(false);

  const pushAssistant = useCallback((text: string, suggestions?: string[]) => {
    setMessages((prev) => [
      ...prev,
      { id: nextId(), role: "assistant", text, ...(suggestions?.length ? { suggestions } : {}) },
    ]);
  }, []);

  const sendMessage = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || !enabled) return;

      setMessages((prev) => [...prev, { id: nextId(), role: "user", text }]);
      setThinking(true);
      try {
        const result = runCompanyStockAgentTurn(text, ctx);
        if (result.action) options?.onAction?.(result.action);
        pushAssistant(result.reply, result.suggestions);
      } finally {
        setThinking(false);
      }
    },
    [ctx, enabled, options?.onAction, pushAssistant],
  );

  const resetConversation = useCallback(() => {
    setMessages([]);
    bootedRef.current = false;
  }, []);

  const ensureWelcome = useCallback(() => {
    if (!enabled || bootedRef.current) return;
    bootedRef.current = true;
    const welcome = runCompanyStockAgentTurn("", ctx);
    pushAssistant(welcome.reply, welcome.suggestions);
  }, [ctx, enabled, pushAssistant]);

  return {
    messages,
    thinking,
    sendMessage,
    resetConversation,
    ensureWelcome,
    enabled,
  };
}
