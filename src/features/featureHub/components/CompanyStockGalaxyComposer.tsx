"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GalaxyButton from "@/core/ui/GalaxyButton/GalaxyButton";
import {
  DASHBOARD_DESKTOP_GALAXY_STRIP_CLASS,
  DASHBOARD_DESKTOP_GALAXY_STRIP_INNER_CLASS,
} from "@/core/ui/dashboardDesktopLayout";
import {
  GalaxyComposerNewButton,
  GalaxyComposerSendButton,
} from "@/features/chatbot/components/GalaxyComposerControls";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useCompanyStockAgentBridgeOptional } from "@/context/CompanyStockAgentBridgeContext";
import {
  consumePendingMaterialAgentQuickPrompt,
  MATERIAL_AGENT_PENDING_QUICK_PROMPT_EVENT,
} from "@/features/featureHub/companyStockChatbot";

/** Dock Galaxy — saisie agent matériel (aligné ChatbotGalaxyComposer). */
export default function CompanyStockGalaxyComposer() {
  const { t } = useTranslation();
  const bridge = useCompanyStockAgentBridgeOptional();
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handlers = bridge?.handlers ?? null;
  const disabled = !handlers || handlers.disabled;

  const flushPendingQuickPrompt = useCallback(() => {
    if (!handlers || handlers.disabled) return;
    const pending = consumePendingMaterialAgentQuickPrompt();
    if (!pending) return;
    handlers.sendMessage(pending);
    setInput("");
  }, [handlers]);

  useEffect(() => {
    if (bridge?.handlers) return;
    setInput("");
  }, [bridge?.handlers]);

  useEffect(() => {
    flushPendingQuickPrompt();
  }, [flushPendingQuickPrompt]);

  useEffect(() => {
    const onQuick = (e: Event) => {
      const text = (e as CustomEvent<{ text?: string }>).detail?.text?.trim();
      if (!text || !handlers || handlers.disabled) return;
      handlers.sendMessage(text);
      setInput("");
    };
    const onDraft = (e: Event) => {
      const text = (e as CustomEvent<{ text?: string }>).detail?.text?.trim();
      if (text) setInput(text);
    };
    const onPending = () => {
      flushPendingQuickPrompt();
    };
    window.addEventListener("material-agent-quick-prompt", onQuick);
    window.addEventListener("material-agent-draft-prompt", onDraft);
    window.addEventListener(MATERIAL_AGENT_PENDING_QUICK_PROMPT_EVENT, onPending);
    window.addEventListener("chatbot-quick-prompt", onQuick);
    window.addEventListener("chatbot-draft-prompt", onDraft);
    return () => {
      window.removeEventListener("material-agent-quick-prompt", onQuick);
      window.removeEventListener("material-agent-draft-prompt", onDraft);
      window.removeEventListener(MATERIAL_AGENT_PENDING_QUICK_PROMPT_EVENT, onPending);
      window.removeEventListener("chatbot-quick-prompt", onQuick);
      window.removeEventListener("chatbot-draft-prompt", onDraft);
    };
  }, [handlers, flushPendingQuickPrompt]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || disabled || !handlers) return;
    handlers.sendMessage(trimmed);
    setInput("");
  };

  return (
    <motion.div
      data-testid="company-stock-galaxy-composer"
      className={`${DASHBOARD_DESKTOP_GALAXY_STRIP_CLASS} box-border flex min-w-0 flex-col items-stretch`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
    >
      <div className={`relative ${DASHBOARD_DESKTOP_GALAXY_STRIP_INNER_CLASS} shrink-0`}>
        <GalaxyButton asInteractiveButton={false} className="chatbot-galaxy-composer h-full w-full">
          <motion.div className="chatbot-galaxy-composer-field pointer-events-auto">
            <AnimatePresence>
              {handlers ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.92, x: -8 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.92, x: -8 }}
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                  className="contents"
                >
                  <GalaxyComposerNewButton
                    testId="company-stock-agent-new-conversation"
                    ariaLabel={String(t("companyStock.agent_reset"))}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlers.resetConversation?.();
                      setInput("");
                    }}
                  />
                </motion.div>
              ) : null}
            </AnimatePresence>
            <textarea
              ref={inputRef}
              data-testid="company-stock-galaxy-input"
              value={input}
              disabled={disabled}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              rows={1}
              placeholder={handlers ? "" : String(t("companyStock.company_required"))}
              className="chatbot-galaxy-composer-input bg-transparent py-0 text-center text-[15px] leading-snug text-white placeholder:text-center placeholder:text-white/65 focus:outline-none disabled:opacity-50"
              aria-label={String(t("companyStock.agent_placeholder"))}
            />
            {handlers ? (
              <GalaxyComposerSendButton
                testId="company-stock-agent-send"
                ariaLabel={String(t("chatbot.send_aria"))}
                disabled={disabled || !input.trim()}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSend();
                }}
              />
            ) : null}
          </motion.div>
        </GalaxyButton>
      </div>
    </motion.div>
  );
}
