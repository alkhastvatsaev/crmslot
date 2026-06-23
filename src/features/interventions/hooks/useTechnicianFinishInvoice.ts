"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import { useTranslation } from "@/core/i18n/I18nContext";
import type { DraftBillingLine } from "@/features/interventions/draftInvoiceBilling";
import {
  applyQuickInvoiceAdjust,
  invoiceTotalCents,
  removeBillingLineAt,
  type QuickInvoiceAdjustId,
} from "@/features/interventions/technicianInvoiceQuickAdjust";

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

type Args = {
  interventionId: string;
  clientEmail?: string | null;
  initialLines?: DraftBillingLine[];
  onSent?: () => void;
};

export function useTechnicianFinishInvoice({
  interventionId,
  clientEmail,
  initialLines,
  onSent,
}: Args) {
  const { t } = useTranslation();
  const [lines, setLines] = useState<DraftBillingLine[]>(initialLines ?? []);
  const [loadingDraft, setLoadingDraft] = useState(!initialLines?.length);
  const [sending, setSending] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);

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

  const applyChip = (adjustId: QuickInvoiceAdjustId) => {
    setLines((prev) => applyQuickInvoiceAdjust(prev, adjustId));
  };

  const removeLine = (index: number) => {
    setLines((prev) => removeBillingLineAt(prev, index));
  };

  return {
    t,
    lines,
    loadingDraft,
    sending,
    adjustOpen,
    setAdjustOpen,
    totalCents,
    recipient,
    hasRecipient,
    canSend,
    loadDraft,
    handleSend,
    applyChip,
    removeLine,
  };
}
