"use client";

type Props = {
  clientName: string;
  clientEmail: string;
  clientNamePlaceholder: string;
  clientEmailPlaceholder: string;
  onClientNameChange: (value: string) => void;
  onClientEmailChange: (value: string) => void;
};

export default function QuoteEditorClientFields({
  clientName,
  clientEmail,
  clientNamePlaceholder,
  clientEmailPlaceholder,
  onClientNameChange,
  onClientEmailChange,
}: Props) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <input
        data-testid="quote-client-name"
        value={clientName}
        onChange={(e) => onClientNameChange(e.target.value)}
        placeholder={clientNamePlaceholder}
        className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
      />
      <input
        data-testid="quote-client-email"
        value={clientEmail}
        onChange={(e) => onClientEmailChange(e.target.value)}
        placeholder={clientEmailPlaceholder}
        type="email"
        className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
      />
    </div>
  );
}
