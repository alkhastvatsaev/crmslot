"use client";

type Props = {
  validityDays: number;
  notes: string;
  validityDaysLabel: string;
  notesLabel: string;
  onValidityDaysChange: (value: number) => void;
  onNotesChange: (value: string) => void;
};

export default function QuoteEditorMetaFields({
  validityDays,
  notes,
  validityDaysLabel,
  notesLabel,
  onValidityDaysChange,
  onNotesChange,
}: Props) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <div>
        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {validityDaysLabel}
        </label>
        <input
          data-testid="quote-validity"
          type="number"
          min={1}
          value={validityDays}
          onChange={(e) => onValidityDaysChange(Math.max(1, Number(e.target.value)))}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {notesLabel}
        </label>
        <textarea
          data-testid="quote-notes"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm resize-none"
        />
      </div>
    </div>
  );
}
