"use client";

import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { toast } from "sonner";
import { useFeatureFlag } from "@/core/useFeatureFlags";
import { auth, firestore } from "@/core/config/firebase";
import { useTranslation } from "@/core/i18n/I18nContext";
import { logCrmInterventionAction } from "@/features/crmHistory/logCrmInterventionAction";
import { BILLING_TEMPLATES } from "@/features/interventions/config/terrainTemplates";
import {
  PAYMENT_STATUSES,
  type InvoiceBillingPanelProps,
  type PaymentStatus,
} from "@/features/billing/invoiceBillingPanelTypes";
import { paymentStatusLabel } from "@/features/billing/invoiceBillingPanelUtils";

export function useInvoiceBillingPanelController({
  intervention,
  onApplyTemplate,
}: InvoiceBillingPanelProps) {
  const { t } = useTranslation();
  const quotesEnabled = useFeatureFlag("quotesEnabled");
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);

  const paymentStatus = (intervention.paymentStatus ?? "unpaid") as PaymentStatus;
  const statusLabels = Object.fromEntries(
    PAYMENT_STATUSES.map((s) => [s, paymentStatusLabel(t, s)])
  ) as Record<PaymentStatus, string>;

  const handleStatusChange = async (newStatus: PaymentStatus) => {
    if (!firestore) return;
    setSaving(true);
    try {
      await updateDoc(doc(firestore, "interventions", intervention.id), {
        paymentStatus: newStatus,
        ...(newStatus === "paid" ? { paidAt: new Date().toISOString() } : {}),
        updatedAt: new Date().toISOString(),
      });
      const actorUid = auth?.currentUser?.uid?.trim() || "system";
      await logCrmInterventionAction({
        kind: "intervention_payment_updated",
        iv: intervention,
        actorUid,
        actorRole: "dispatcher",
        note: `Paiement → ${newStatus}`,
      });
      toast.success(String(t("billing.toast_status_updated")));
    } catch {
      toast.error(String(t("billing.toast_error")));
    } finally {
      setSaving(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const tpl = BILLING_TEMPLATES.find((b) => b.id === templateId);
    if (!tpl) return;
    const total = tpl.lines.reduce((sum, l) => sum + l.unitPriceCents * l.quantity, 0);
    onApplyTemplate?.(total / 100);
  };

  return {
    t,
    quotesEnabled,
    expanded,
    setExpanded,
    saving,
    paymentStatus,
    statusLabels,
    handleStatusChange,
    handleTemplateSelect,
    intervention,
  };
}
