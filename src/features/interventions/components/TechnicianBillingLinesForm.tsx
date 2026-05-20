"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, FileText, Mic, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useBrowserSpeechDictation } from "@/features/interventions/useBrowserSpeechDictation";
import {
  BILLING_TEMPLATES,
  type BillingTemplateLine,
} from "@/features/interventions/config/terrainTemplates";
import ProductQuickAddBar from "@/features/catalog/components/ProductQuickAddBar";
import BillingLineSuggestions from "@/features/interventions/components/BillingLineSuggestions";
import { useTranslation } from "@/core/i18n/I18nContext";
import type { Intervention } from "@/features/interventions/types";
import { lecotShopCatalogSearchUrl } from "@/features/catalog/lecotShopConfig";

export interface BillingLine {
  description: string;
  quantity: number;
  unitPriceCents: number;
  reference?: string;
}

type Props = {
  initialLines?: BillingLine[];
  onConfirm: (lines: BillingLine[]) => void;
  onSkip: () => void;
  onBack?: () => void;
  intervention?: Pick<Intervention, "category" | "problem">;
};

const emptyLine = (): BillingLine => ({
  description: "",
  quantity: 1,
  unitPriceCents: 0,
  reference: "",
});

export default function TechnicianBillingLinesForm({
  initialLines,
  onConfirm,
  onSkip,
  onBack,
  intervention,
}: Props) {
  const { t } = useTranslation();
  const [lines, setLines] = useState<BillingLine[]>(
    initialLines && initialLines.length > 0 ? initialLines : [emptyLine()],
  );

  const [dictatedText, setDictatedText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleTranscript = (text: string) => {
    setDictatedText((prev) => (prev ? `${prev} ${text}` : text));
  };

  const { listening, toggleListening, interimTranscript } = useBrowserSpeechDictation(
    handleTranscript
  );

  const handleDictationResult = async (text: string) => {
    if (!text.trim()) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/ai/parse-billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: text }),
      });
      const data = await res.json();
      if (data.success && data.lines && data.lines.length > 0) {
        const newLines = data.lines.map((l: Partial<BillingLine>) => ({
          description: l.description || "",
          quantity: l.quantity || 1,
          unitPriceCents: l.unitPriceCents || 0,
          reference: l.reference || "",
        }));
        
        setLines((prev) => {
          if (prev.length === 1 && !prev[0].description) {
            return newLines;
          }
          return [...prev, ...newLines];
        });
        toast.success(t("billing_lines.voice_success") || "Lignes ajoutées via IA");
      } else {
        toast.error(t("billing_lines.voice_empty") || "Aucune ligne détectée");
      }
    } catch (e) {
      console.error(e);
      toast.error(t("billing_lines.voice_error") || "Erreur lors de l'analyse");
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (!listening && dictatedText.trim()) {
      const textToAnalyze = dictatedText;
      setDictatedText("");
      handleDictationResult(textToAnalyze);
    }
  }, [listening, dictatedText]);

  const handleLoadTemplate = (templateId: string) => {
    if (!templateId) return;
    const tpl = BILLING_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    setLines(
      tpl.lines.map((l: BillingTemplateLine) => ({
        description: l.description,
        quantity: l.quantity,
        unitPriceCents: l.unitPriceCents,
        reference: l.reference || "",
      })),
    );
  };

  const updateLine = (
    idx: number,
    field: keyof BillingLine,
    value: string | number,
  ) => {
    setLines((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l)),
    );
  };

  const removeLine = (idx: number) =>
    setLines((prev) => prev.filter((_, i) => i !== idx));

  const addLine = () => setLines((prev) => [...prev, emptyLine()]);

  const totalCents = lines.reduce(
    (sum, l) => sum + l.quantity * l.unitPriceCents,
    0,
  );

  const hasValidLines = lines.some((l) => l.description.trim() !== "");

  return (
    <div
      data-testid="billing-lines-form"
      className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-500"
    >
      {intervention ? (
        <ProductQuickAddBar
          intervention={intervention}
          onAddLine={(line) => setLines((prev) => [...prev, line])}
        />
      ) : null}
      {intervention ? (
        <BillingLineSuggestions
          problem={intervention.problem}
          category={intervention.category}
          onApply={(suggested) => setLines(suggested)}
        />
      ) : null}
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-slate-800" aria-hidden />
          <h2 className="text-[15px] font-semibold text-slate-800">
            {t("billing_lines.title")}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => {
            if (!listening) setDictatedText("");
            toggleListening();
          }}
          className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-[13px] font-bold transition-all ${
            listening 
              ? "bg-red-100 text-red-600 animate-pulse" 
              : "bg-purple-100 text-purple-700 hover:bg-purple-200"
          }`}
          disabled={isAnalyzing}
          title="Dictez votre facturation pour générer les lignes automatiquement"
        >
          {isAnalyzing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
          {isAnalyzing ? "Analyse..." : listening ? "Écoute..." : "Saisie IA"}
        </button>
      </div>

      {(interimTranscript || dictatedText) && listening && (
        <div className="px-3 py-2 text-[13px] italic text-slate-600 bg-slate-100 rounded-lg animate-in fade-in">
          {dictatedText} {interimTranscript}
        </div>
      )}

      {/* Template selector */}
      <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3">
        <label className="mb-1.5 block text-[12px] font-bold text-blue-900">
          {t("billing_lines.template_label")}
        </label>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {BILLING_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              data-testid={`billing-template-${tpl.id}`}
              onClick={() => handleLoadTemplate(tpl.id)}
              className="shrink-0 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-blue-700 border border-blue-200 shadow-sm transition-all hover:bg-blue-600 hover:text-white hover:border-blue-600 active:scale-95"
            >
              {tpl.name}
            </button>
          ))}
        </div>
      </div>

      {/* Line items */}
      <div className="space-y-3">
        {lines.map((line, idx) => (
          <div
            key={idx}
            className="relative rounded-xl border border-slate-100 bg-slate-50 p-3"
          >
            {lines.length > 1 && (
              <button
                type="button"
                data-testid={`billing-line-remove-${idx}`}
                onClick={() => removeLine(idx)}
                className="absolute -right-2 -top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-red-600 transition hover:bg-red-200"
                aria-label={t("billing_lines.remove_line")}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}

            <div className="flex flex-col gap-2">
              <input
                type="text"
                data-testid={`billing-line-desc-${idx}`}
                value={line.description}
                onChange={(e) => updateLine(idx, "description", e.target.value)}
                placeholder={t("billing_lines.description_placeholder")}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {t("materials.form.reference_label")}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      data-testid={`billing-line-reference-${idx}`}
                      value={line.reference || ""}
                      onChange={(e) => updateLine(idx, "reference", e.target.value)}
                      placeholder={String(t("materials.form.reference_placeholder"))}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <a
                      href={lecotShopCatalogSearchUrl(line.reference || line.description)}
                      target="_blank" rel="noreferrer"
                      className="flex shrink-0 items-center justify-center rounded-lg bg-slate-800 px-3 text-[11px] font-bold text-white hover:bg-slate-700 transition-colors"
                      onClick={(e) => {
                        if (!line.reference && !line.description) e.preventDefault();
                      }}
                      title={String(t("materials.form.lecot_title"))}
                    >
                      Lecot
                    </a>
                  </div>
                </div>
                <div className="w-16 shrink-0">
                  <label className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {t("billing_lines.qty")}
                  </label>
                  <input
                    type="number"
                    data-testid={`billing-line-qty-${idx}`}
                    value={line.quantity}
                    min={0.5}
                    step={0.5}
                    onChange={(e) =>
                      updateLine(idx, "quantity", Number(e.target.value))
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="w-24 shrink-0">
                  <label className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {t("billing_lines.unit_price")}
                  </label>
                  <input
                    type="number"
                    data-testid={`billing-line-price-${idx}`}
                    value={(line.unitPriceCents / 100).toFixed(2)}
                    min={0}
                    step={0.5}
                    onChange={(e) =>
                      updateLine(
                        idx,
                        "unitPriceCents",
                        Math.round(Number(e.target.value) * 100),
                      )
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add line */}
      <button
        type="button"
        data-testid="billing-add-line"
        onClick={addLine}
        className="flex items-center gap-1.5 self-start rounded-lg px-3 py-2 text-[13px] font-semibold text-blue-600 transition hover:bg-blue-50"
      >
        <Plus className="h-4 w-4" />
        {t("billing_lines.add_line")}
      </button>

      {/* Total */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
        <span className="text-[13px] font-bold text-slate-600">
          {t("billing_lines.total")}
        </span>
        <span className="text-[18px] font-black text-black">
          {(totalCents / 100).toFixed(2)} €
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {onBack ? (
          <button
            type="button"
            data-testid="billing-back"
            onClick={onBack}
            className="flex min-h-[52px] flex-1 items-center justify-center rounded-[20px] bg-white text-[14px] font-semibold text-slate-600 shadow-sm ring-1 ring-inset ring-black/5 transition hover:bg-slate-50 active:scale-[0.98]"
          >
            ← {t("billing_lines.skip")}
          </button>
        ) : (
          <button
            type="button"
            data-testid="billing-skip"
            onClick={onSkip}
            className="flex min-h-[52px] flex-1 items-center justify-center rounded-[20px] bg-white text-[14px] font-semibold text-slate-600 shadow-sm ring-1 ring-inset ring-black/5 transition hover:bg-slate-50 active:scale-[0.98]"
          >
            {t("billing_lines.skip")}
          </button>
        )}
        <button
          type="button"
          data-testid="billing-confirm"
          disabled={!hasValidLines}
          onClick={() => onConfirm(lines.filter((l) => l.description.trim()))}
          className="flex min-h-[52px] flex-[2] items-center justify-center gap-2 rounded-[20px] bg-slate-900 text-[14px] font-semibold text-white shadow-lg transition hover:bg-slate-800 active:scale-[0.98] disabled:opacity-40"
        >
          <FileText className="h-4 w-4" />
          {t("billing_lines.confirm")}
        </button>
      </div>
    </div>
  );
}
