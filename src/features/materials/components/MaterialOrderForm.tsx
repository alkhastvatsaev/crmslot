"use client";

import { useState } from "react";
import { useTranslation } from "@/core/i18n/I18nContext";
import type { MaterialOrderPart } from "@/features/materials/types";

import { TERRAIN_TEMPLATES } from "@/features/interventions/config/terrainTemplates";

type Props = {
  interventionId: string;
  technicianUid: string;
  onSubmitOrder: (parts: MaterialOrderPart[], urgency: "low" | "normal" | "high") => Promise<void>;
  onCancel: () => void;
};

export function MaterialOrderForm({ onSubmitOrder, onCancel }: Props) {
  const { t } = useTranslation();
  const [parts, setParts] = useState<MaterialOrderPart[]>([
    { description: "", quantity: 1, reference: "" },
  ]);
  const [urgency, setUrgency] = useState<"low" | "normal" | "high">("normal");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLoadTemplate = (templateId: string) => {
    if (!templateId) return;
    const tpl = TERRAIN_TEMPLATES.find(t => t.id === templateId);
    if (tpl) {
      setParts(tpl.lines.map(l => ({ description: l.description, quantity: l.quantity, reference: l.reference || "" })));
    }
  };

  const handleAddPart = () => {
    setParts([...parts, { description: "", quantity: 1, reference: "" }]);
  };

  const handleRemovePart = (index: number) => {
    setParts(parts.filter((_, i) => i !== index));
  };

  const handleChangePart = (index: number, field: keyof MaterialOrderPart, value: string | number) => {
    const newParts = [...parts];
    newParts[index] = { ...newParts[index], [field]: value };
    setParts(newParts);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validParts = parts.filter((p) => p.description.trim() !== "");
    if (validParts.length === 0) return;

    setIsSubmitting(true);
    try {
      await onSubmitOrder(validParts, urgency);
    } finally {
      setIsSubmitting(false);
    }
  };

  const urgencyLabel = (level: "low" | "normal" | "high") => {
    if (level === "low") return t("materials.form.urgency_low");
    if (level === "high") return t("materials.form.urgency_high");
    return t("materials.form.urgency_normal");
  };

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm" data-testid="material-order-form">
      <h2 className="mb-2 text-xl font-bold text-slate-800">{t("materials.form.title")}</h2>
      <p className="mb-6 text-sm text-slate-500">{t("materials.form.hint")}</p>

      <div className="mb-6 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
        <label className="block text-sm font-bold text-blue-900 mb-2">Charger un modèle rapide</label>
        <select
          onChange={(e) => handleLoadTemplate(e.target.value)}
          defaultValue=""
          className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="" disabled>-- Sélectionner un modèle --</option>
          {TERRAIN_TEMPLATES.map(tpl => (
            <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
          ))}
        </select>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
        <div className="space-y-4">
          {parts.map((part, index) => (
            <div
              key={index}
              className="relative flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4"
            >
              {parts.length > 1 ? (
                <button
                  type="button"
                  data-testid={`material-order-remove-line-${index}`}
                  onClick={() => handleRemovePart(index)}
                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-red-600 hover:bg-red-200"
                  aria-label={String(t("common.delete"))}
                >
                  ×
                </button>
              ) : null}

              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  {t("materials.form.description_label")}
                </label>
                <input
                  type="text"
                  required
                  data-testid={`material-order-description-${index}`}
                  value={part.description}
                  onChange={(e) => handleChangePart(index, "description", e.target.value)}
                  placeholder={String(t("materials.form.description_placeholder"))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="w-24">
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  {t("materials.form.qty_label")}
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  data-testid={`material-order-qty-${index}`}
                  value={part.quantity}
                  onChange={(e) => handleChangePart(index, "quantity", Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex-1 flex flex-col">
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  {t("materials.form.reference_label")}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    data-testid={`material-order-reference-${index}`}
                    value={part.reference || ""}
                    onChange={(e) => handleChangePart(index, "reference", e.target.value)}
                    placeholder={String(t("materials.form.reference_placeholder"))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                  <a
                    href={`https://lecot.be/fr-be/search?q=${encodeURIComponent(part.reference || part.description)}`}
                    target="_blank" rel="noreferrer"
                    className="flex shrink-0 items-center justify-center rounded-lg bg-slate-800 px-3 text-xs font-bold text-white hover:bg-slate-700 transition-colors"
                    onClick={(e) => {
                      if (!part.reference && !part.description) e.preventDefault();
                    }}
                    title="Vérifier sur Lecot.be"
                  >
                    Lecot
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          data-testid="material-order-add-line"
          onClick={handleAddPart}
          className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          <span>+</span> {t("materials.form.add_line")}
        </button>

        <div className="border-t border-slate-100 pt-4">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            {t("materials.form.urgency_label")}
          </label>
          <div className="flex gap-4">
            {(["low", "normal", "high"] as const).map((level) => (
              <label key={level} className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="urgency"
                  data-testid={`material-order-urgency-${level}`}
                  value={level}
                  checked={urgency === level}
                  onChange={() => setUrgency(level)}
                  className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">{urgencyLabel(level)}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            data-testid="material-order-cancel"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 rounded-xl bg-slate-100 px-4 py-3 font-medium text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-50"
          >
            {t("common.cancel")}
          </button>
          <button
            type="submit"
            data-testid="material-order-submit"
            disabled={isSubmitting || !parts.some((p) => p.description.trim())}
            className="flex-[2] rounded-xl bg-blue-600 px-4 py-3 font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? t("materials.form.submitting") : t("materials.form.submit")}
          </button>
        </div>
      </form>
    </div>
  );
}
