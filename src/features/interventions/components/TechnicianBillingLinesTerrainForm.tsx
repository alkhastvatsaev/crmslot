"use client";

import { Plus, Mic, Loader2 } from "lucide-react";
import { BILLING_TEMPLATES } from "@/features/interventions/config/terrainTemplates";
import { emptyBillingLine, type BillingLine } from "@/features/interventions/billingLineTypes";

type TerrainFormProps = {
  lines: BillingLine[];
  totalCents: number;
  hasValidLines: boolean;
  listening: boolean;
  isAnalyzing: boolean;
  confirmBusy: boolean;
  clientEmailHint?: string | null;
  resolvedConfirmLabel: string;
  resolvedSkipLabel: string;
  onBack?: () => void;
  onSkip: () => void;
  onConfirm: (lines: BillingLine[]) => void;
  onLoadTemplate: (id: string) => void;
  onToggleVoice: () => void;
  onUpdateLine: (idx: number, field: keyof BillingLine, value: string | number) => void;
  onAddLine: () => void;
  t: (key: string) => string;
};

export default function TechnicianBillingLinesTerrainForm({
  lines,
  totalCents,
  hasValidLines,
  listening,
  isAnalyzing,
  confirmBusy,
  clientEmailHint,
  resolvedConfirmLabel,
  resolvedSkipLabel,
  onBack,
  onSkip,
  onConfirm,
  onLoadTemplate,
  onToggleVoice,
  onUpdateLine,
  onAddLine,
  t,
}: TerrainFormProps) {
  const editIndex = 0;
  const line = lines[editIndex] ?? emptyBillingLine();

  return (
    <div
      data-testid="billing-lines-form"
      className="flex min-h-0 flex-1 flex-col overflow-hidden gap-2"
    >
      <div className="flex shrink-0 items-center justify-between gap-2">
        <span className="text-[13px] font-semibold text-slate-800">{t("billing_lines.title")}</span>
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-bold tabular-nums text-slate-900">
            {(totalCents / 100).toFixed(2)} €
          </span>
          <button
            type="button"
            onClick={onToggleVoice}
            disabled={isAnalyzing}
            aria-label={String(t("billing_lines.voice_aria") || "Dictée")}
            className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
              listening ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-700"
            }`}
          >
            {isAnalyzing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <div className="flex shrink-0 gap-1.5 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {BILLING_TEMPLATES.map((tpl) => (
          <button
            key={tpl.id}
            type="button"
            data-testid={`billing-template-${tpl.id}`}
            onClick={() => onLoadTemplate(tpl.id)}
            className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200/80 active:scale-95"
          >
            {tpl.name}
          </button>
        ))}
      </div>

      {lines.length > 1 ? (
        <p className="shrink-0 text-[11px] font-medium text-slate-500">
          {lines.length} {t("billing_lines.lines_count") || "lignes"}
        </p>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col justify-center gap-2 overflow-hidden">
        <input
          type="text"
          data-testid="billing-line-desc-0"
          value={line.description}
          onChange={(e) => onUpdateLine(editIndex, "description", e.target.value)}
          placeholder={t("billing_lines.description_placeholder")}
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[14px] outline-none focus:ring-2 focus:ring-slate-400"
        />
        <div className="flex gap-2">
          <input
            type="number"
            data-testid="billing-line-qty-0"
            value={line.quantity}
            min={0.5}
            step={0.5}
            aria-label={t("billing_lines.qty")}
            onChange={(e) => onUpdateLine(editIndex, "quantity", Number(e.target.value))}
            className="w-16 rounded-xl border border-slate-200 px-2 py-2 text-center text-[14px] outline-none"
          />
          <input
            type="number"
            data-testid="billing-line-price-0"
            value={(line.unitPriceCents / 100).toFixed(2)}
            min={0}
            step={0.5}
            aria-label={t("billing_lines.unit_price")}
            onChange={(e) =>
              onUpdateLine(editIndex, "unitPriceCents", Math.round(Number(e.target.value) * 100))
            }
            className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-[14px] outline-none"
          />
          <button
            type="button"
            data-testid="billing-add-line"
            onClick={onAddLine}
            aria-label={t("billing_lines.add_line")}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {clientEmailHint ? (
        <p
          data-testid="billing-client-email-hint"
          className="shrink-0 text-center text-[11px] font-medium text-slate-500"
        >
          {clientEmailHint}
        </p>
      ) : null}

      <div className="flex shrink-0 gap-2 pt-1">
        {onBack ? (
          <button
            type="button"
            data-testid="billing-back"
            onClick={onBack}
            disabled={confirmBusy}
            className="flex h-11 min-w-[5rem] flex-1 items-center justify-center rounded-full bg-slate-100 text-[13px] font-semibold text-slate-600 disabled:opacity-50"
          >
            {resolvedSkipLabel}
          </button>
        ) : (
          <button
            type="button"
            data-testid="billing-skip"
            onClick={onSkip}
            disabled={confirmBusy}
            className="flex h-11 min-w-[5rem] flex-1 items-center justify-center rounded-full bg-slate-100 text-[13px] font-semibold text-slate-600 disabled:opacity-50"
          >
            {resolvedSkipLabel}
          </button>
        )}
        <button
          type="button"
          data-testid="billing-confirm"
          disabled={!hasValidLines || confirmBusy}
          onClick={() => onConfirm(lines.filter((l) => l.description.trim()))}
          className="flex h-11 flex-[2] items-center justify-center gap-2 rounded-full bg-emerald-600 text-[13px] font-semibold text-white disabled:opacity-40"
        >
          {confirmBusy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          {resolvedConfirmLabel}
        </button>
      </div>
    </div>
  );
}
