"use client";

import { useTranslation } from "@/core/i18n/I18nContext";
import type { Intervention } from "@/features/interventions/types";
import type { BillingLine } from "@/features/interventions/billingLineTypes";
import { useTechnicianBillingLinesForm } from "@/features/interventions/hooks/useTechnicianBillingLinesForm";
import TechnicianBillingLinesTerrainForm from "@/features/interventions/components/TechnicianBillingLinesTerrainForm";
import TechnicianBillingLinesDesktopForm from "@/features/interventions/components/TechnicianBillingLinesDesktopForm";

export type { BillingLine } from "@/features/interventions/billingLineTypes";

type Props = {
  initialLines?: BillingLine[];
  onConfirm: (lines: BillingLine[]) => void;
  onSkip: () => void;
  onBack?: () => void;
  intervention?: Pick<Intervention, "category" | "problem">;
  /** Wizard clôture terrain : pas de scroll, champs réduits. */
  variant?: "default" | "terrain";
  confirmLabel?: string;
  skipLabel?: string;
  clientEmailHint?: string | null;
  confirmBusy?: boolean;
};

export default function TechnicianBillingLinesForm({
  initialLines,
  onConfirm,
  onSkip,
  onBack,
  intervention,
  variant = "default",
  confirmLabel,
  skipLabel,
  clientEmailHint,
  confirmBusy = false,
}: Props) {
  const { t } = useTranslation();
  const form = useTechnicianBillingLinesForm(initialLines, t);
  const resolvedConfirmLabel = confirmLabel ?? String(t("billing_lines.confirm"));
  const resolvedSkipLabel = skipLabel ?? String(t("billing_lines.skip"));

  if (variant === "terrain") {
    return (
      <TechnicianBillingLinesTerrainForm
        lines={form.lines}
        totalCents={form.totalCents}
        hasValidLines={form.hasValidLines}
        listening={form.listening}
        isAnalyzing={form.isAnalyzing}
        confirmBusy={confirmBusy}
        clientEmailHint={clientEmailHint}
        resolvedConfirmLabel={resolvedConfirmLabel}
        resolvedSkipLabel={resolvedSkipLabel}
        onBack={onBack}
        onSkip={onSkip}
        onConfirm={onConfirm}
        onLoadTemplate={form.handleLoadTemplate}
        onToggleVoice={form.toggleVoice}
        onUpdateLine={form.updateLine}
        onAddLine={form.addLine}
        t={t}
      />
    );
  }

  return (
    <TechnicianBillingLinesDesktopForm
      lines={form.lines}
      setLines={form.setLines}
      totalCents={form.totalCents}
      hasValidLines={form.hasValidLines}
      listening={form.listening}
      isAnalyzing={form.isAnalyzing}
      interimTranscript={form.interimTranscript}
      dictatedText={form.dictatedText}
      intervention={intervention}
      onBack={onBack}
      onSkip={onSkip}
      onConfirm={onConfirm}
      onLoadTemplate={form.handleLoadTemplate}
      onToggleVoice={form.toggleVoice}
      onUpdateLine={form.updateLine}
      onRemoveLine={form.removeLine}
      onAddLine={form.addLine}
      t={t}
    />
  );
}
