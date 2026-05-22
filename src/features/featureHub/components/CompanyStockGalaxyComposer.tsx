"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GalaxyButton from "@/core/ui/GalaxyButton/GalaxyButton";
import {
  DASHBOARD_DESKTOP_GALAXY_STRIP_CLASS,
  DASHBOARD_DESKTOP_GALAXY_STRIP_INNER_CLASS,
} from "@/core/ui/dashboardDesktopLayout";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useCompanyStockAgentBridgeOptional } from "@/context/CompanyStockAgentBridgeContext";

const outfit = { fontFamily: "'Outfit', sans-serif" } as const;

/** Dock Galaxy — saisie agent matériel (aligné ChatbotGalaxyComposer). */
export default function CompanyStockGalaxyComposer() {
  const { t } = useTranslation();
  const bridge = useCompanyStockAgentBridgeOptional();
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handlers = bridge?.handlers ?? null;
  const disabled = !handlers || handlers.disabled;

  useEffect(() => {
    if (bridge?.handlers) return;
    setInput("");
  }, [bridge?.handlers]);

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
        <GalaxyButton
          asInteractiveButton={false}
          className="chatbot-galaxy-composer h-full w-full"
        >
          <motion.div
            className="pointer-events-auto relative flex h-full w-full max-w-3xl items-center justify-center gap-3 px-4"
            style={outfit}
          >
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
              className="max-h-24 min-h-0 w-full min-w-0 flex-1 resize-none bg-transparent py-1 text-center text-[15px] leading-snug text-white placeholder:text-center placeholder:text-white/65 focus:outline-none disabled:opacity-50"
              aria-label={String(t("companyStock.agent_placeholder"))}
            />
            <AnimatePresence>
              {handlers ? (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8, x: 10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8, x: 10 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  type="button"
                  data-testid="company-stock-agent-new-conversation"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlers.resetConversation?.();
                    setInput("");
                  }}
                  title={String(t("companyStock.agent_reset"))}
                  aria-label={String(t("companyStock.agent_reset"))}
                  className="absolute right-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus:outline-none"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="h-5 w-5"
                    aria-hidden
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </motion.button>
              ) : null}
            </AnimatePresence>
          </motion.div>
        </GalaxyButton>
      </div>
    </motion.div>
  );
}
