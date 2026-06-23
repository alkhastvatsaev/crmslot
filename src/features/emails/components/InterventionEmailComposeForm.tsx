"use client";

import { Send, X } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";
import { cn } from "@/lib/utils";
import type { InterventionEmailComposeState } from "@/features/emails/interventionEmailPanelTypes";

type Props = {
  compose: InterventionEmailComposeState;
  onComposeChange: (patch: Partial<InterventionEmailComposeState>) => void;
  onClose: () => void;
  onSend: () => void;
  sending: boolean;
};

export default function InterventionEmailComposeForm({
  compose,
  onComposeChange,
  onClose,
  onSend,
  sending,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className="border-t border-slate-100 p-4 space-y-3" data-testid="email-compose-form">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
          {compose.inReplyTo ? t("emails.compose_reply") : t("emails.compose_new")}
        </span>
        <button
          type="button"
          data-testid="email-compose-close"
          onClick={onClose}
          className="flex items-center justify-center w-6 h-6 rounded-full text-slate-400 hover:bg-slate-100"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <input
        type="email"
        data-testid="email-compose-to"
        placeholder={String(t("emails.placeholder_to"))}
        value={compose.to}
        onChange={(e) => onComposeChange({ to: e.target.value })}
        className="w-full rounded-[10px] border border-slate-200 px-3 py-2 text-[13px] focus:outline-none focus:border-blue-400"
      />
      <input
        type="text"
        data-testid="email-compose-subject"
        placeholder={String(t("emails.placeholder_subject"))}
        value={compose.subject}
        onChange={(e) => onComposeChange({ subject: e.target.value })}
        className="w-full rounded-[10px] border border-slate-200 px-3 py-2 text-[13px] focus:outline-none focus:border-blue-400"
      />
      <textarea
        rows={4}
        data-testid="email-compose-body"
        placeholder={String(t("emails.placeholder_body"))}
        value={compose.bodyText}
        onChange={(e) => onComposeChange({ bodyText: e.target.value })}
        className="w-full resize-none rounded-[10px] border border-slate-200 px-3 py-2 text-[13px] focus:outline-none focus:border-blue-400"
      />
      <div className="flex justify-end gap-2">
        <button
          type="button"
          data-testid="email-compose-cancel"
          onClick={onClose}
          className="rounded-[10px] px-3 py-2 text-[12px] font-semibold text-slate-500 hover:bg-slate-100"
        >
          {t("common.cancel")}
        </button>
        <button
          type="button"
          data-testid="email-compose-send"
          disabled={sending}
          onClick={() => void onSend()}
          className={cn(
            "flex items-center gap-1.5 rounded-[10px] px-4 py-2 text-[12px] font-bold text-white transition-all",
            sending
              ? "bg-blue-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 active:scale-95"
          )}
        >
          <Send className="w-3.5 h-3.5" />
          {sending ? t("emails.sending") : t("emails.send")}
        </button>
      </div>
    </div>
  );
}
