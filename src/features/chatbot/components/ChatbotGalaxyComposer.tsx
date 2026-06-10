"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GalaxyButton from "@/core/ui/GalaxyButton/GalaxyButton";
import {
  DASHBOARD_DESKTOP_GALAXY_STRIP_CLASS,
  DASHBOARD_DESKTOP_GALAXY_STRIP_INNER_CLASS,
} from "@/core/ui/dashboardDesktopLayout";
import {
  GalaxyComposerMicButton,
  GalaxyComposerNewButton,
  GalaxyComposerSendButton,
} from "@/features/chatbot/components/GalaxyComposerControls";
import { useChatbotContext } from "@/features/chatbot/ChatbotContext";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useBrowserSpeechDictation } from "@/features/interventions/useBrowserSpeechDictation";
import ChatbotImageUpload from "@/features/chatbot/components/ChatbotImageUpload";

/** Zone de saisie Chatbot dans le Galaxy dock. */
export default function ChatbotGalaxyComposer() {
  const { companyId, sendMessage, streaming, pendingTool, newConversation } = useChatbotContext();
  const { t } = useTranslation();
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const appendTranscript = useCallback((text: string) => {
    setInput((prev) => (prev.trim() ? `${prev.trim()} ${text}` : text));
  }, []);

  const {
    listening,
    supported: micSupported,
    toggleListening,
    interimTranscript,
  } = useBrowserSpeechDictation(appendTranscript);

  const [selectedImage, setSelectedImage] = useState<{ dataUrl: string; mimeType: string } | null>(
    null
  );

  useEffect(() => {
    const onQuick = (e: Event) => {
      const text = (e as CustomEvent<{ text?: string }>).detail?.text;
      if (text?.trim()) void sendMessage(text);
    };
    const onDraft = (e: Event) => {
      const text = (e as CustomEvent<{ text?: string }>).detail?.text;
      if (text?.trim()) setInput(text.trim());
    };
    window.addEventListener("chatbot-quick-prompt", onQuick);
    window.addEventListener("chatbot-draft-prompt", onDraft);
    return () => {
      window.removeEventListener("chatbot-quick-prompt", onQuick);
      window.removeEventListener("chatbot-draft-prompt", onDraft);
    };
  }, [sendMessage]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    void sendMessage(trimmed, selectedImage?.dataUrl);
    setInput("");
    setSelectedImage(null);
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
      {selectedImage ? (
        <div className="mx-auto mb-1 flex items-center gap-2 px-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selectedImage.dataUrl}
            alt="Image jointe"
            className="h-10 w-10 rounded-lg object-cover border border-white/20"
          />
          <button
            type="button"
            onClick={() => setSelectedImage(null)}
            className="text-[11px] text-white/60 hover:text-white"
            aria-label="Supprimer l'image"
          >
            ✕
          </button>
        </div>
      ) : null}
      <div className={`relative ${DASHBOARD_DESKTOP_GALAXY_STRIP_INNER_CLASS} shrink-0`}>
        <GalaxyButton asInteractiveButton={false} className="chatbot-galaxy-composer h-full w-full">
          <motion.div className="chatbot-galaxy-composer-field pointer-events-auto">
            <AnimatePresence>
              {companyId ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.92, x: -8 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.92, x: -8 }}
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                  className="contents"
                >
                  <GalaxyComposerNewButton
                    testId="chatbot-new-conversation"
                    ariaLabel={String(t("chatbot.new_conversation"))}
                    onClick={(e) => {
                      e.stopPropagation();
                      newConversation();
                    }}
                  />
                </motion.div>
              ) : null}
            </AnimatePresence>
            <textarea
              ref={inputRef}
              data-testid="chatbot-input"
              value={interimTranscript && !input ? interimTranscript : input}
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
                listening ? "…" : companyId ? "" : String(t("chatbot.select_company_placeholder"))
              }
              className="chatbot-galaxy-composer-input bg-transparent py-0 text-center text-[15px] leading-snug placeholder:text-center focus:outline-none disabled:opacity-50"
              style={{ color: interimTranscript && !input ? "rgba(255,255,255,0.55)" : "white" }}
              aria-label={String(t("chatbot.input_aria"))}
            />
            {micSupported ? (
              <GalaxyComposerMicButton
                testId="chatbot-mic"
                ariaLabel={listening ? "Arrêter la dictée" : "Dicter un message"}
                listening={listening}
                disabled={!companyId}
                onClick={(e) => {
                  e.stopPropagation();
                  void toggleListening();
                }}
              />
            ) : null}
            <ChatbotImageUpload
              disabled={disabled}
              onImageSelected={(dataUrl, mimeType) => setSelectedImage({ dataUrl, mimeType })}
            />
            <GalaxyComposerSendButton
              testId="chatbot-send"
              ariaLabel={String(t("chatbot.send_aria"))}
              disabled={disabled || (!input.trim() && !interimTranscript.trim())}
              onClick={(e) => {
                e.stopPropagation();
                handleSend();
              }}
            />
          </motion.div>
        </GalaxyButton>
      </div>
    </motion.div>
  );
}
