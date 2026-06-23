"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { logger } from "@/core/logger";
import { useBrowserSpeechDictation } from "@/features/interventions/useBrowserSpeechDictation";
import {
  BILLING_TEMPLATES,
  type BillingTemplateLine,
} from "@/features/interventions/config/terrainTemplates";
import { emptyBillingLine, type BillingLine } from "@/features/interventions/billingLineTypes";

export function useTechnicianBillingLinesForm(
  initialLines: BillingLine[] | undefined,
  t: (key: string) => string
) {
  const [lines, setLines] = useState<BillingLine[]>(
    initialLines && initialLines.length > 0 ? initialLines : [emptyBillingLine()]
  );
  const [dictatedText, setDictatedText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleTranscript = (text: string) => {
    setDictatedText((prev) => (prev ? `${prev} ${text}` : text));
  };

  const { listening, toggleListening, interimTranscript } =
    useBrowserSpeechDictation(handleTranscript);

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
      logger.error(e instanceof Error ? e.message : String(e));
      toast.error(t("billing_lines.voice_error") || "Erreur lors de l'analyse");
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (!listening && dictatedText.trim()) {
      const textToAnalyze = dictatedText;
      setDictatedText("");
      void handleDictationResult(textToAnalyze);
    }
    // handleDictationResult is intentionally excluded: it only calls setLines which is stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listening, dictatedText]);

  const handleLoadTemplate = (templateId: string) => {
    if (!templateId) return;
    const tpl = BILLING_TEMPLATES.find((tplItem) => tplItem.id === templateId);
    if (!tpl) return;
    setLines(
      tpl.lines.map((l: BillingTemplateLine) => ({
        description: l.description,
        quantity: l.quantity,
        unitPriceCents: l.unitPriceCents,
        reference: l.reference || "",
      }))
    );
  };

  const updateLine = (idx: number, field: keyof BillingLine, value: string | number) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));
  };

  const removeLine = (idx: number) => setLines((prev) => prev.filter((_, i) => i !== idx));

  const addLine = () => setLines((prev) => [...prev, emptyBillingLine()]);

  const totalCents = lines.reduce((sum, l) => sum + l.quantity * l.unitPriceCents, 0);
  const hasValidLines = lines.some((l) => l.description.trim() !== "");

  const toggleVoice = () => {
    if (!listening) setDictatedText("");
    toggleListening();
  };

  return {
    lines,
    setLines,
    listening,
    isAnalyzing,
    interimTranscript,
    dictatedText,
    handleLoadTemplate,
    updateLine,
    removeLine,
    addLine,
    totalCents,
    hasValidLines,
    toggleVoice,
  };
}
