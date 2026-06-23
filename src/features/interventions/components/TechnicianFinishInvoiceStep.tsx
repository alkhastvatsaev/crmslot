"use client";

import type { DraftBillingLine } from "@/features/interventions/draftInvoiceBilling";
import TechnicianFinishInvoiceAdjustPanel from "@/features/interventions/components/TechnicianFinishInvoiceAdjustPanel";
import TechnicianFinishInvoiceSummaryView from "@/features/interventions/components/TechnicianFinishInvoiceSummaryView";
import { useTechnicianFinishInvoice } from "@/features/interventions/hooks/useTechnicianFinishInvoice";

type Props = {
  interventionId: string;
  clientEmail?: string | null;
  clientName?: string | null;
  initialLines?: DraftBillingLine[];
  initialAiNote?: string | null;
  onSent?: () => void;
};

export default function TechnicianFinishInvoiceStep({
  interventionId,
  clientEmail,
  clientName,
  initialLines,
  initialAiNote,
  onSent,
}: Props) {
  const invoice = useTechnicianFinishInvoice({
    interventionId,
    clientEmail,
    initialLines,
    onSent,
  });

  if (invoice.adjustOpen) {
    return (
      <TechnicianFinishInvoiceAdjustPanel
        lines={invoice.lines}
        totalCents={invoice.totalCents}
        loadingDraft={invoice.loadingDraft}
        sending={invoice.sending}
        canSend={invoice.canSend}
        onBack={() => invoice.setAdjustOpen(false)}
        onRemoveLine={invoice.removeLine}
        onApplyChip={invoice.applyChip}
        onRegenerate={invoice.loadDraft}
        onSend={invoice.handleSend}
      />
    );
  }

  return (
    <TechnicianFinishInvoiceSummaryView
      totalCents={invoice.totalCents}
      loadingDraft={invoice.loadingDraft}
      sending={invoice.sending}
      canSend={invoice.canSend}
      clientName={clientName}
      recipient={invoice.recipient}
      hasRecipient={invoice.hasRecipient}
      initialAiNote={initialAiNote}
      onSend={invoice.handleSend}
      onAdjustOpen={() => invoice.setAdjustOpen(true)}
    />
  );
}
