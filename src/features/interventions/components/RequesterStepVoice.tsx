"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Mic, Square, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import { AudioPlayer, AudioDownloadButton } from "./RequesterAudioPlayer";

interface RequesterStepVoiceProps {
  description: string;
  audioBlob: Blob | null;
  isListening: boolean;
  isVoiceSupported: boolean;
  interimTranscript: string;
  onToggleVoice: () => void;
  onDescriptionChange: (value: string) => void;
  onRemoveAudio: () => void;
}

const inputClass =
  "min-w-0 flex-1 rounded-[14px] border border-black/[0.06] bg-white/95 px-4 py-3 text-base text-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-slate-900/15";

export function RequesterStepVoice({
  description,
  audioBlob,
  isListening,
  isVoiceSupported,
  interimTranscript,
  onToggleVoice,
  onDescriptionChange,
  onRemoveAudio,
}: RequesterStepVoiceProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-sm gap-8 -mt-10">
      <div className="text-center space-y-2">
        <h3 id="requester-step1-title" className="text-2xl font-bold text-slate-800">
          {String(t("requester.intervention.step1_title"))}
        </h3>
      </div>

      <button
        type="button"
        onClick={onToggleVoice}
        disabled={!isVoiceSupported}
        aria-pressed={isListening}
        aria-label={
          isListening
            ? String(t("smart_form.step2.recording"))
            : String(t("smart_form.step2.pressToSpeak"))
        }
        className={cn(
          "relative flex h-24 w-24 items-center justify-center rounded-full transition-all duration-300 shadow-sm border border-black/5",
          isListening
            ? "bg-red-50 text-red-500 shadow-[0_0_40px_rgba(239,68,68,0.3)] scale-110 border-red-200"
            : "bg-blue-500 text-white shadow-[0_4px_20px_-4px_rgba(59,130,246,0.45)] hover:bg-blue-600 hover:scale-105 border-transparent"
        )}
      >
        <AnimatePresence mode="wait">
          {isListening ? (
            <motion.div
              key="stop"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Square className="h-8 w-8 fill-current" />
            </motion.div>
          ) : (
            <motion.div
              key="mic"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Mic className="h-10 w-10" />
            </motion.div>
          )}
        </AnimatePresence>
        {isListening && (
          <span className="absolute -bottom-7 text-sm font-bold text-red-500 animate-pulse uppercase tracking-wide">
            {String(t("requester.intervention.listening"))}
          </span>
        )}
      </button>

      <div className="w-full relative mt-4">
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder={String(t("requester.intervention.description_placeholder"))}
          aria-label={String(t("smart_form.step2.descriptionAria"))}
          className={cn(
            inputClass,
            "min-h-[120px] resize-none text-center p-4 pt-6 w-full bg-slate-50/50 shadow-inner rounded-[24px] text-slate-700"
          )}
        />
        {description && (
          <button
            type="button"
            onClick={() => onDescriptionChange("")}
            aria-label={String(t("common.delete"))}
            className="absolute top-3 right-3 p-1.5 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
        {interimTranscript && (
          <div className="mt-3 p-3 rounded-2xl bg-slate-100/80 text-base text-slate-600 italic text-center animate-pulse border border-slate-200">
            {interimTranscript}
          </div>
        )}
        {audioBlob && !isListening && (
          <div className="mt-3 flex flex-col items-center gap-2 w-full">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold uppercase tracking-wide text-slate-400">
                {String(t("requester.intervention.voice_saved_label"))}
              </span>
              <AudioDownloadButton blob={audioBlob} />
            </div>
            <AudioPlayer blob={audioBlob} onRemove={onRemoveAudio} />
          </div>
        )}
      </div>
    </div>
  );
}
