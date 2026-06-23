"use client";

import { Save, Send } from "lucide-react";

type Props = {
  busy: boolean;
  saveLabel: string;
  sendLabel: string;
  onSave: () => void;
  onSend: () => void;
};

export default function QuoteEditorActions({ busy, saveLabel, sendLabel, onSave, onSend }: Props) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        data-testid="quote-save"
        disabled={busy}
        onClick={onSave}
        className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        <Save className="h-4 w-4" />
        {saveLabel}
      </button>
      <button
        type="button"
        data-testid="quote-send"
        disabled={busy}
        onClick={onSend}
        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
      >
        <Send className="h-4 w-4" />
        {sendLabel}
      </button>
    </div>
  );
}
