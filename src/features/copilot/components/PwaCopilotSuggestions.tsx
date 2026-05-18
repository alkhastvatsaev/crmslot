"use client";

import { Sparkles } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";

const PROMPT_KEYS = [
  "copilot.prompt_priorities",
  "copilot.prompt_unpaid",
  "copilot.prompt_urgent",
  "copilot.prompt_clients",
  "copilot.prompt_summary_day",
] as const;

type Props = {
  onPick: (prompt: string) => void;
  disabled?: boolean;
};

export default function PwaCopilotSuggestions({ onPick, disabled }: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-2" data-testid="pwa-copilot-suggestions">
      <p className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-400">
        <Sparkles className="h-3.5 w-3.5" aria-hidden />
        {t("copilot.suggestions_title")}
      </p>
      {PROMPT_KEYS.map((key) => {
        const label = t(key);
        return (
          <button
            key={key}
            type="button"
            disabled={disabled}
            data-testid={`pwa-copilot-suggestion-${key.split(".").pop()}`}
            onClick={() => onPick(label)}
            className="rounded-[14px] border border-slate-200/90 bg-white px-3 py-2.5 text-left text-[12px] font-medium leading-snug text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50/50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
