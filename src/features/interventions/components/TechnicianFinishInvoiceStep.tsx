"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Headphones, Loader2, Mail, Mic, Square } from "lucide-react";
import { toast } from "sonner";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import { useTranslation } from "@/core/i18n/I18nContext";
import { HubButton } from "@/core/ui/hub";
import type { DraftBillingLine } from "@/features/interventions/draftInvoiceBilling";
import { useBrowserSpeechDictation } from "@/features/interventions/useBrowserSpeechDictation";
import {
  formatInvoiceTotalEur,
  invoiceTotalCents,
} from "@/features/interventions/technicianInvoiceQuickAdjust";
import { cn } from "@/lib/utils";

type DraftBillingResponse = {
  ok?: boolean;
  billingLines?: DraftBillingLine[];
  invoiceAmountCents?: number;
  aiNote?: string;
  error?: string;
};

type IssueInvoiceResponse = {
  ok?: boolean;
  emailSent?: boolean;
  emailError?: string;
  error?: string;
};

type Props = {
  interventionId: string;
  clientEmail?: string | null;
  clientName?: string | null;
  initialLines?: DraftBillingLine[];
  initialAiNote?: string | null;
  onSent?: () => void;
  onSkip?: () => void;
};

export default function TechnicianFinishInvoiceStep({
  interventionId,
  clientEmail,
  clientName,
  initialLines,
  initialAiNote,
  onSent,
  onSkip,
}: Props) {
  const { t } = useTranslation();
  const [lines, setLines] = useState<DraftBillingLine[]>(initialLines ?? []);
  const [loadingDraft, setLoadingDraft] = useState(!initialLines?.length);
  const [sending, setSending] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const [escalateOpen, setEscalateOpen] = useState(false);
  const [voiceNote, setVoiceNote] = useState("");

  const appendVoiceNote = useCallback((text: string) => {
    const piece = text.trim();
    if (!piece) return;
    setVoiceNote((prev) => (prev ? `${prev} ${piece}` : piece));
  }, []);

  const {
    listening,
    supported: voiceSupported,
    toggleListening,
    interimTranscript,
  } = useBrowserSpeechDictation(appendVoiceNote);

  const loadDraft = useCallback(async () => {
    setLoadingDraft(true);
    try {
      const res = await fetchWithAuth(
        `/api/interventions/${encodeURIComponent(interventionId)}/prepare-draft-billing`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ forceRegenerate: true }),
        }
      );
      const data = (await res.json()) as DraftBillingResponse;
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "Préparation facture impossible");
      }
      setLines(Array.isArray(data.billingLines) ? data.billingLines : []);
    } catch (e) {
      toast.error(String(t("technician_hub.finish.invoice.draft_error")), {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setLoadingDraft(false);
    }
  }, [interventionId, t]);

  useEffect(() => {
    if (initialLines?.length) {
      setLines(initialLines);
      setLoadingDraft(false);
      return;
    }
    void loadDraft();
  }, [initialLines, loadDraft]);

  const totalCents = useMemo(() => invoiceTotalCents(lines), [lines]);
  const recipient = (clientEmail ?? "").trim();
  const hasRecipient = recipient.includes("@");
  const canSend = !loadingDraft && !sending && lines.length > 0;

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    try {
      const res = await fetchWithAuth(
        `/api/interventions/${encodeURIComponent(interventionId)}/issue-invoice`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sendEmail: true, billingLines: lines }),
        }
      );
      const data = (await res.json()) as IssueInvoiceResponse;
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "Envoi facture impossible");
      }
      if (data.emailSent) {
        toast.success(String(t("technician_hub.finish.invoice.sent_ok")), {
          description: hasRecipient
            ? String(t("technician_hub.finish.invoice.sent_ok_desc")).replace(
                "{{email}}",
                recipient
              )
            : undefined,
        });
      } else {
        toast.message(String(t("technician_hub.finish.invoice.sent_no_mail")), {
          description: data.emailError ?? String(t("technician_hub.finish.invoice.no_email")),
        });
      }
      onSent?.();
    } catch (e) {
      toast.error(String(t("technician_hub.finish.invoice.send_error")), {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setSending(false);
    }
  };

  const handleEscalate = async () => {
    if (escalating) return;
    setEscalating(true);
    try {
      const res = await fetchWithAuth(
        `/api/interventions/${encodeURIComponent(interventionId)}/request-invoice-review`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note: voiceNote.trim() }),
        }
      );
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "Transmission back-office impossible");
      }
      toast.success(String(t("technician_hub.finish.invoice.escalate_ok")), {
        description: String(t("technician_hub.finish.invoice.escalate_ok_desc")),
      });
      onSkip?.();
    } catch (e) {
      toast.error(String(t("technician_hub.finish.invoice.escalate_error")), {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setEscalating(false);
    }
  };

  const displayNote = voiceNote.trim() || interimTranscript.trim();

  return (
    <div
      data-testid="finish-job-step-invoice"
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <div className="flex flex-1 flex-col items-center justify-center px-2 py-4 text-center">
        <div className="w-full max-w-sm rounded-2xl border border-indigo-100 bg-gradient-to-b from-indigo-50/80 to-white px-5 py-6 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wide text-indigo-600">
            {String(t("technician_hub.finish.invoice.ready_badge"))}
          </p>
          {loadingDraft ? (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              {String(t("technician_hub.finish.invoice.preparing"))}
            </div>
          ) : (
            <p
              data-testid="finish-invoice-total"
              className="mt-3 text-4xl font-black tabular-nums text-slate-900"
            >
              {formatInvoiceTotalEur(totalCents)}
            </p>
          )}
          {clientName ? (
            <p className="mt-2 text-sm font-semibold text-slate-700">{clientName}</p>
          ) : null}
          {hasRecipient ? (
            <p
              data-testid="finish-invoice-recipient"
              className="mt-1 flex items-center justify-center gap-1 text-[12px] text-slate-500"
            >
              <Mail className="h-3.5 w-3.5" aria-hidden />
              {recipient}
            </p>
          ) : (
            <p
              data-testid="finish-invoice-no-email"
              className="mt-2 text-[11px] font-medium text-amber-700"
            >
              {String(t("technician_hub.finish.invoice.no_email"))}
            </p>
          )}
          {initialAiNote ? (
            <p className="sr-only" data-testid="finish-invoice-ai-note">
              {initialAiNote}
            </p>
          ) : null}
        </div>

        <p className="mt-4 max-w-xs text-[12px] leading-relaxed text-slate-500">
          {String(t("technician_hub.finish.invoice.auto_hint"))}
        </p>
      </div>

      <div className="shrink-0 space-y-2 border-t border-slate-100 px-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-3">
        <HubButton
          type="button"
          data-testid="finish-invoice-send"
          fullWidth
          disabled={!canSend}
          onClick={() => void handleSend()}
          className="h-14 rounded-full bg-emerald-600 text-[16px] font-bold text-white hover:bg-emerald-700"
        >
          {sending ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          ) : (
            <Mail className="h-5 w-5 shrink-0" aria-hidden />
          )}
          {String(t("technician_hub.finish.invoice.send_cta"))}
        </HubButton>

        {!escalateOpen ? (
          <button
            type="button"
            data-testid="finish-invoice-escalate-open"
            disabled={loadingDraft || sending || escalating}
            onClick={() => setEscalateOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white py-3 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-[0.99] disabled:opacity-40"
          >
            <Headphones className="h-4 w-4 shrink-0" aria-hidden />
            {String(t("technician_hub.finish.invoice.escalate_cta"))}
          </button>
        ) : (
          <div
            data-testid="finish-invoice-escalate-panel"
            className="rounded-2xl border border-amber-100 bg-amber-50/60 p-3 space-y-3"
          >
            <p className="text-[12px] font-semibold text-amber-900">
              {String(t("technician_hub.finish.invoice.escalate_hint"))}
            </p>
            <button
              type="button"
              data-testid="finish-invoice-voice-mic"
              disabled={!voiceSupported || escalating}
              onClick={() => void toggleListening()}
              aria-pressed={listening}
              className={cn(
                "mx-auto flex h-16 w-16 items-center justify-center rounded-full border transition active:scale-95",
                listening
                  ? "border-red-200 bg-red-50 text-red-500"
                  : "border-amber-200 bg-white text-amber-700 shadow-sm"
              )}
              aria-label={String(t("technician_hub.finish.invoice.voice_aria"))}
            >
              {listening ? (
                <Square className="h-7 w-7 fill-current" aria-hidden />
              ) : (
                <Mic className="h-7 w-7" aria-hidden />
              )}
            </button>
            {displayNote ? (
              <p
                data-testid="finish-invoice-voice-note"
                className="rounded-xl bg-white px-3 py-2 text-left text-[12px] leading-snug text-slate-700"
              >
                {displayNote}
              </p>
            ) : (
              <p className="text-[11px] text-amber-800/80">
                {String(t("technician_hub.finish.invoice.voice_empty_hint"))}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                data-testid="finish-invoice-escalate-cancel"
                disabled={escalating}
                onClick={() => {
                  setEscalateOpen(false);
                  setVoiceNote("");
                }}
                className="flex-1 rounded-full border border-slate-200 bg-white py-2.5 text-[12px] font-semibold text-slate-600"
              >
                {String(t("common.cancel"))}
              </button>
              <HubButton
                type="button"
                data-testid="finish-invoice-escalate-submit"
                disabled={escalating}
                onClick={() => void handleEscalate()}
                className="flex-1 rounded-full py-2.5 text-[12px] font-bold"
              >
                {escalating ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  String(t("technician_hub.finish.invoice.escalate_submit"))
                )}
              </HubButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
