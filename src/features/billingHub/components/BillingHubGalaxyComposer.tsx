"use client";

import { useEffect, useRef, useState } from "react";
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
import { useBillingHubAgentBridgeOptional } from "@/context/BillingHubAgentBridgeContext";

export default function BillingHubGalaxyComposer() {
  const { t } = useTranslation();
  const bridge = useBillingHubAgentBridgeOptional();
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handlers = bridge?.handlers ?? null;
  const disabled = !handlers || handlers.disabled;

  useEffect(() => {
    if (bridge?.handlers) return;
    setInput("");
  }, [bridge?.handlers]);

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
    window.addEventListener("billing-agent-quick-prompt", onQuick);
    window.addEventListener("billing-agent-draft-prompt", onDraft);
    return () => {
      window.removeEventListener("billing-agent-quick-prompt", onQuick);
      window.removeEventListener("billing-agent-draft-prompt", onDraft);
    };
  }, [handlers]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || disabled || !handlers) return;
    handlers.sendMessage(trimmed);
    setInput("");
  };

  return (
    <motion.div
      data-testid="billing-hub-galaxy-composer"
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
                    testId="billing-hub-agent-new-conversation"
                    ariaLabel={String(t("billingHub.agent_reset"))}
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
              data-testid="billing-hub-galaxy-input"
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
              placeholder={handlers ? "" : String(t("billingHub.company_required"))}
              className="chatbot-galaxy-composer-input bg-transparent py-0 text-center text-[15px] leading-snug text-white placeholder:text-center placeholder:text-white/65 focus:outline-none disabled:opacity-50"
              aria-label={String(t("billingHub.agent_placeholder"))}
            />
            {handlers ? (
              <GalaxyComposerSendButton
                testId="billing-hub-agent-send"
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
