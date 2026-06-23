"use client";

import { useState } from "react";
import { FileCode2 } from "lucide-react";
import { toast } from "sonner";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import { useFeatureFlag } from "@/core/useFeatureFlags";
import { useTranslation } from "@/core/i18n/I18nContext";
import type { Intervention } from "@/features/interventions";

type Props = { intervention: Intervention };

export default function EInvoiceButton({ intervention }: Props) {
  const { t } = useTranslation();
  const enabled = useFeatureFlag("peppolEInvoicing");
  const [busy, setBusy] = useState(false);

  if (!enabled) return null;
  if (intervention.status !== "invoiced" && intervention.status !== "done") return null;

  const status = intervention.eInvoice?.status;

  const handleSend = async () => {
    setBusy(true);
    try {
      const res = await fetchWithAuth(
        `/api/interventions/${encodeURIComponent(intervention.id)}/e-invoice`,
        { method: "POST" }
      );
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Échec e-facture");
      toast.success(String(t("billing.einvoice_sent")));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(t("common.error")));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div data-testid="e-invoice-button" className="flex items-center gap-2">
      <button
        type="button"
        disabled={busy || status === "sent"}
        onClick={() => void handleSend()}
        className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-800 hover:bg-violet-100 disabled:opacity-50"
      >
        <FileCode2 className="h-3.5 w-3.5" />
        {status === "sent" ? t("billing.einvoice_sent_label") : t("billing.einvoice_send")}
      </button>
    </div>
  );
}
