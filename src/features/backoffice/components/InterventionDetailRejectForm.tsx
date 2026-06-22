"use client";

import { Send } from "lucide-react";
import { HubButton } from "@/core/ui/hub";
import { useTranslation } from "@/core/i18n/I18nContext";
import { QUICK_REJECT_REASON_KEYS } from "@/features/backoffice/components/interventionDetailHelpers";

type Props = {
  rejectBusy: boolean;
  rejectReason: string;
  setRejectReason: (value: string) => void;
  setRejectOpen: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
};

export default function InterventionDetailRejectForm({
  rejectBusy,
  rejectReason,
  setRejectReason,
  setRejectOpen,
  onConfirm,
}: Props) {
  const { t } = useTranslation();

  return (
    <div
      data-testid="backoffice-inbox-reject-form"
      className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-3"
    >
      <p className="text-[13px] font-bold text-amber-900">
        {t("backoffice.inbox.reject_reason_label")}
      </p>
      <div className="flex flex-wrap gap-2">
        {QUICK_REJECT_REASON_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            data-testid={`backoffice-inbox-reject-quick-${key.split(".").pop()}`}
            disabled={rejectBusy}
            onClick={() => setRejectReason(String(t(key)))}
            className="rounded-full border border-amber-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-amber-900 transition hover:bg-amber-100 active:scale-95 disabled:opacity-40"
          >
            {String(t(key))}
          </button>
        ))}
      </div>
      <textarea
        value={rejectReason}
        onChange={(e) => setRejectReason(e.target.value)}
        placeholder={t("backoffice.inbox.reject_reason_placeholder")}
        rows={3}
        className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-[13px] text-slate-800 outline-none focus:border-amber-400 placeholder:text-slate-400 resize-none"
        autoFocus
      />
      <div className="flex gap-2">
        <HubButton
          type="button"
          variant="dangerOutline"
          data-testid="backoffice-inbox-reject-confirm"
          disabled={rejectBusy}
          onClick={() => void onConfirm()}
          className="flex-1"
        >
          <Send className="h-4 w-4" />
          {t("backoffice.inbox.reject_send")}
        </HubButton>
        <HubButton
          type="button"
          disabled={rejectBusy}
          onClick={() => {
            setRejectOpen(false);
            setRejectReason("");
          }}
          className="shrink-0"
        >
          {t("common.cancel")}
        </HubButton>
      </div>
    </div>
  );
}
