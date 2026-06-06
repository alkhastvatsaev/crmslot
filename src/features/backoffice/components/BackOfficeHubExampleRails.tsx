"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Mail, Package, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import { CentralizedTimeline } from "@/features/communications/components/CentralizedTimeline";
import {
  BACK_OFFICE_HUB_EXAMPLE_EMAILS,
  BACK_OFFICE_HUB_EXAMPLE_INTERVENTION,
  BACK_OFFICE_HUB_EXAMPLE_MATERIAL_ORDERS,
  BACK_OFFICE_HUB_EXAMPLE_TIMELINE_EVENTS,
} from "@/features/backoffice/backOfficeHubExample";

function formatEur(cents: number): string {
  return `${(cents / 100).toFixed(2).replace(".", ",")} €`;
}

export function BackOfficeHubExampleTimeline() {
  return (
    <div data-testid="backoffice-hub-example-timeline">
      <CentralizedTimeline events={BACK_OFFICE_HUB_EXAMPLE_TIMELINE_EVENTS} />
    </div>
  );
}

export function BackOfficeHubExampleEmails() {
  const { t } = useTranslation();

  return (
    <div
      data-testid="backoffice-hub-example-emails"
      className="space-y-3 rounded-[18px] border border-slate-100 bg-white p-4"
    >
      {BACK_OFFICE_HUB_EXAMPLE_EMAILS.map((email) => (
        <article
          key={email.id}
          data-testid={`backoffice-hub-example-email-${email.id}`}
          className={cn(
            "rounded-[16px] border px-3 py-2.5",
            email.direction === "inbound"
              ? "border-slate-100 bg-slate-50"
              : "ml-6 border-blue-100 bg-blue-50/80"
          )}
        >
          <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <Mail className="h-3.5 w-3.5" aria-hidden />
            {email.direction === "inbound"
              ? t("backoffice.hub.example_email_in")
              : t("backoffice.hub.example_email_out")}
            <span className="ml-auto font-normal normal-case tracking-normal text-slate-400">
              {format(new Date(email.at), "dd MMM HH:mm", { locale: fr })}
            </span>
          </div>
          <p className="text-[13px] font-semibold text-slate-800">{email.subject}</p>
          <p className="mt-1 text-[12px] leading-relaxed text-slate-600">{email.preview}</p>
        </article>
      ))}
    </div>
  );
}

export function BackOfficeHubExampleMaterials() {
  const { t } = useTranslation();

  return (
    <div
      data-testid="backoffice-hub-example-materials"
      className="space-y-2 rounded-[18px] border border-slate-100 bg-white p-4"
    >
      {BACK_OFFICE_HUB_EXAMPLE_MATERIAL_ORDERS.map((order) => (
        <div
          key={order.id}
          data-testid={`backoffice-hub-example-material-${order.id}`}
          className="flex items-start gap-3 rounded-[14px] border border-slate-100 bg-slate-50/80 px-3 py-2.5"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm">
            <Package className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-slate-800">{order.label}</p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              {t(`materials.status.${order.status}`)} ·{" "}
              {order.urgency === "urgent"
                ? t("materials.form.urgency_high")
                : t("materials.form.urgency_normal")}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function BackOfficeHubExampleBilling() {
  const { t } = useTranslation();
  const iv = BACK_OFFICE_HUB_EXAMPLE_INTERVENTION;
  const lines = iv.billingLines ?? [];
  const total = lines.reduce((sum, l) => sum + l.quantity * l.unitPriceCents, 0);

  return (
    <div
      data-testid="backoffice-hub-example-billing"
      className="space-y-3 rounded-[18px] border border-slate-100 bg-white p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-slate-500">
          <CreditCard className="h-4 w-4" aria-hidden />
          {t("intervention_drawer.tab_billing")}
        </span>
        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
          {t("backoffice.hub.example_paid")}
        </span>
      </div>
      <ul className="space-y-2" data-testid="backoffice-hub-example-billing-lines">
        {lines.map((line, idx) => (
          <li
            key={`${line.description}-${idx}`}
            className="flex justify-between gap-3 border-b border-slate-50 pb-2 text-[13px] text-slate-700 last:border-0"
          >
            <span className="min-w-0">
              {line.description}
              {line.quantity > 1 ? ` × ${line.quantity}` : ""}
            </span>
            <span className="shrink-0 font-semibold tabular-nums">
              {formatEur(line.quantity * line.unitPriceCents)}
            </span>
          </li>
        ))}
      </ul>
      <div className="flex justify-between rounded-[14px] bg-slate-50 px-3 py-2 text-[14px] font-bold text-slate-900">
        <span>{t("backoffice.hub.example_total")}</span>
        <span className="tabular-nums">{formatEur(total)}</span>
      </div>
      {typeof iv.commissionAmountCents === "number" ? (
        <p className="text-[11px] text-slate-500">
          {t("backoffice.hub.example_commission")}: {formatEur(iv.commissionAmountCents)}
        </p>
      ) : null}
    </div>
  );
}
