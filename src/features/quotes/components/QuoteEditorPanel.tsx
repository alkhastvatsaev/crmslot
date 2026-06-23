"use client";

import QuoteStatusBadge from "@/features/quotes/components/QuoteStatusBadge";
import QuoteEditorClientFields from "@/features/quotes/components/QuoteEditorClientFields";
import QuoteEditorLinesTable from "@/features/quotes/components/QuoteEditorLinesTable";
import QuoteEditorTotals from "@/features/quotes/components/QuoteEditorTotals";
import QuoteEditorMetaFields from "@/features/quotes/components/QuoteEditorMetaFields";
import QuoteEditorActions from "@/features/quotes/components/QuoteEditorActions";
import { useQuoteEditorPanelController } from "@/features/quotes/hooks/useQuoteEditorPanelController";
import type { QuoteEditorPanelProps } from "@/features/quotes/quoteEditorPanelTypes";

export default function QuoteEditorPanel(props: QuoteEditorPanelProps) {
  const c = useQuoteEditorPanelController(props);

  return (
    <div
      data-testid="quote-editor-panel"
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900">{c.t("quotes.editor_title")}</h3>
        {c.quote ? <QuoteStatusBadge status={c.quote.status} /> : null}
      </div>

      <QuoteEditorClientFields
        clientName={c.clientName}
        clientEmail={c.clientEmail}
        clientNamePlaceholder={String(c.t("quotes.client_name"))}
        clientEmailPlaceholder={String(c.t("quotes.client_email"))}
        onClientNameChange={c.setClientName}
        onClientEmailChange={c.setClientEmail}
      />

      <QuoteEditorLinesTable
        lines={c.lines}
        colDescription={String(c.t("quotes.col_description"))}
        colQty={String(c.t("quotes.col_qty"))}
        colPrice={String(c.t("quotes.col_price"))}
        linePlaceholder={String(c.t("quotes.line_placeholder"))}
        addLineLabel={String(c.t("quotes.add_line"))}
        onAddLine={c.addLine}
        onRemoveLine={c.removeLine}
        onUpdateLine={c.updateLine}
      />

      <QuoteEditorTotals
        totalHT={c.totalHT}
        tva={c.tva}
        totalTTC={c.totalTTC}
        totalHtLabel={String(c.t("quotes.total_ht"))}
        tvaLabel={String(c.t("quotes.tva_6"))}
        totalTtcLabel={String(c.t("quotes.total_ttc"))}
      />

      <QuoteEditorMetaFields
        validityDays={c.validityDays}
        notes={c.notes}
        validityDaysLabel={String(c.t("quotes.validity_days"))}
        notesLabel={String(c.t("quotes.notes"))}
        onValidityDaysChange={c.setValidityDays}
        onNotesChange={c.setNotes}
      />

      <QuoteEditorActions
        busy={c.busy}
        saveLabel={String(c.t("quotes.save"))}
        sendLabel={String(c.t("quotes.send"))}
        onSave={() => void c.handleSave(false)}
        onSend={() => void c.handleSave(true)}
      />
    </div>
  );
}
