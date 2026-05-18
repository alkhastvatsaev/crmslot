"use client";

import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { CreditCard, FileText, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { firestore } from "@/core/config/firebase";
import { useTranslation } from "@/core/i18n/I18nContext";
import { coerceFirestoreLikeDate } from "@/features/interventions/technicianSchedule";
import { BILLING_TEMPLATES } from "@/features/interventions/config/terrainTemplates";
import type { Intervention } from "@/features/interventions/types";

const outfit = { fontFamily: "'Outfit', sans-serif" } as const;

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  unpaid: "bg-red-100 text-red-600",
  refunded: "bg-slate-100 text-slate-500",
};

function formatDate(val: unknown): string {
  const d = coerceFirestoreLikeDate(val);
  if (!d || Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-BE", { day: "2-digit", month: "short", year: "numeric" });
}

type Props = {
  intervention: Intervention;
  onApplyTemplate?: (amountEuros: number) => void;
};

type PaymentStatus = "unpaid" | "pending" | "paid" | "refunded";

export default function InvoiceBillingPanel({ intervention, onApplyTemplate }: Props) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);

  const paymentStatus = intervention.paymentStatus ?? "unpaid";
  const statusLabel: Record<PaymentStatus, string> = {
    paid: t("billing.status_paid") as string,
    pending: t("billing.status_pending") as string,
    unpaid: t("billing.status_unpaid") as string,
    refunded: t("billing.status_refunded") as string,
  };

  const handleStatusChange = async (newStatus: PaymentStatus) => {
    if (!firestore) return;
    setSaving(true);
    try {
      await updateDoc(doc(firestore, "interventions", intervention.id), {
        paymentStatus: newStatus,
        ...(newStatus === "paid" ? { paidAt: new Date().toISOString() } : {}),
        updatedAt: new Date().toISOString(),
      });
      toast.success(t("billing.toast_status_updated") as string);
    } catch {
      toast.error(t("billing.toast_error") as string);
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

  return (
    <div style={outfit} className="space-y-2">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between rounded-[14px] bg-slate-50 px-4 py-3 border border-slate-100 hover:bg-slate-100/80 transition-colors"
      >
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-slate-500" />
          <span className="text-[12px] font-bold text-slate-700 uppercase tracking-widest">
            {t("billing.panel_title")}
          </span>
          <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-bold uppercase", STATUS_STYLES[paymentStatus] ?? "bg-slate-100 text-slate-500")}>
            {statusLabel[paymentStatus as PaymentStatus] ?? paymentStatus}
          </span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      {expanded && (
        <div className="rounded-[18px] border border-slate-100 bg-white p-4 space-y-4">
          {/* Billing template quick-fill */}
          <div>
            <label className="mb-1.5 block text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              {String(t("billing.template_label"))}
            </label>
            <select
              defaultValue=""
              onChange={(e) => { handleTemplateSelect(e.target.value); e.currentTarget.value = ""; }}
              className="w-full rounded-[10px] border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="" disabled>{t("billing.template_placeholder")}</option>
              {BILLING_TEMPLATES.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
              ))}
            </select>
          </div>

          {/* Dates */}
          {intervention.invoicedAt && (
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                {t("billing.invoiced_at")}
              </span>
              <span className="text-[12px] text-slate-600">{formatDate(intervention.invoicedAt)}</span>
            </div>
          )}
          {intervention.paidAt && (
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                {t("billing.paid_at")}
              </span>
              <span className="text-[12px] text-slate-600">{formatDate(intervention.paidAt)}</span>
            </div>
          )}

          {/* Payment status selector */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
              {t("billing.payment_status")}
            </span>
            <div className="flex flex-wrap gap-2">
              {(["unpaid", "pending", "paid", "refunded"] as PaymentStatus[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={saving || paymentStatus === s}
                  onClick={() => void handleStatusChange(s)}
                  className={cn(
                    "rounded-full px-3 py-1 text-[11px] font-bold transition-all",
                    paymentStatus === s
                      ? (STATUS_STYLES[s] ?? "bg-slate-100 text-slate-500") + " ring-2 ring-offset-1 ring-current"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200 disabled:opacity-50",
                  )}
                >
                  {statusLabel[s]}
                </button>
              ))}
            </div>
          </div>

          {/* PDF invoice link */}
          {intervention.invoicePdfUrl && (
            <a
              href={intervention.invoicePdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-[12px] border border-slate-100 px-3 py-2.5 text-[12px] font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <FileText className="w-4 h-4" />
              {t("billing.view_invoice_pdf")}
              <ExternalLink className="w-3 h-3 ml-auto" />
            </a>
          )}

          {/* Stripe payment link */}
          {intervention.stripePaymentLinkUrl && (
            <a
              href={intervention.stripePaymentLinkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-[12px] border border-slate-100 px-3 py-2.5 text-[12px] font-semibold text-emerald-600 hover:bg-emerald-50 transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              {t("billing.stripe_link")}
              <ExternalLink className="w-3 h-3 ml-auto" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
