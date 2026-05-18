"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import GalaxyButton from "@/core/ui/GalaxyButton/GalaxyButton";
import {
  DASHBOARD_DESKTOP_GALAXY_STRIP_CLASS,
  DASHBOARD_DESKTOP_GALAXY_STRIP_INNER_CLASS,
} from "@/core/ui/dashboardDesktopLayout";
import { useChatbotContext } from "@/features/chatbot/ChatbotContext";

const outfit = { fontFamily: "'Outfit', sans-serif" } as const;

/** Zone de saisie Chatbot dans le Galaxy dock (page 5 uniquement). */
export default function ChatbotGalaxyComposer() {
  const { companyId, sendMessage, streaming, pendingTool } = useChatbotContext();
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const onQuick = (e: Event) => {
      const text = (e as CustomEvent<{ text?: string }>).detail?.text;
      if (text?.trim()) void sendMessage(text);
    };
    window.addEventListener("chatbot-quick-prompt", onQuick);
    return () => window.removeEventListener("chatbot-quick-prompt", onQuick);
  }, [sendMessage]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    void sendMessage(trimmed);
    setInput("");
  };

  const disabled = !companyId || streaming || Boolean(pendingTool);

  return (
    <motion.div
      data-testid="chatbot-galaxy-composer"
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
            className="pointer-events-auto flex h-full w-full max-w-3xl items-center justify-center px-6"
            style={outfit}
          >
            <textarea
              ref={inputRef}
              data-testid="chatbot-input"
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
              placeholder={
                companyId ? "Demandez au Chatbot…" : "Sélectionnez une société active…"
              }
              className="max-h-24 min-h-0 w-full min-w-0 flex-1 resize-none bg-transparent py-1 text-center text-[15px] leading-snug text-white placeholder:text-center placeholder:text-white/65 focus:outline-none disabled:opacity-50"
              aria-label="Message Chatbot"
            />
          </motion.div>
        </GalaxyButton>
      </div>
    </motion.div>
  );
}
