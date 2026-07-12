"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";
import {
  PUBLIC_SUBSCRIPTION_PLAN_ID,
  SUBSCRIPTION_PLANS,
  startSubscriptionCheckout,
  subscriptionCheckoutEnabled,
} from "@/features/subscriptions";
import CrmslotLockMark from "@/features/subscriptions/components/CrmslotLockMark";

/** Écran plein page — activer l’accès CRMSLOT (1 CTA → Stripe). */
export default function SubscriptionPaywall() {
  const { t } = useTranslation();
  const plan = SUBSCRIPTION_PLANS[0];
  const checkoutEnabled = subscriptionCheckoutEnabled();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setError(null);
    setBusy(true);
    try {
      const url = await startSubscriptionCheckout(PUBLIC_SUBSCRIPTION_PLAN_ID);
      window.location.assign(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[radial-gradient(circle_at_top,#f8fafc_0,#fff_42%,#f8fafc_100%)] p-4"
      data-testid="subscription-paywall"
      role="dialog"
      aria-modal="true"
      aria-labelledby="subscription-paywall-title"
    >
      <div className="w-full max-w-md rounded-[2rem] border border-slate-200/80 bg-white/95 p-6 shadow-[0_30px_90px_-60px_rgba(2,6,23,0.55)] backdrop-blur sm:p-8">
        <div className="mb-5 flex justify-center">
          <CrmslotLockMark className="h-12 w-10" />
        </div>

        <div className="text-center">
          <h1
            id="subscription-paywall-title"
            className="text-[clamp(1.4rem,4vw,1.85rem)] font-semibold tracking-tight text-slate-950"
          >
            {t("subscription.paywall.title")}
          </h1>
          <p className="mt-2 text-[13px] text-slate-500">{t(plan.taglineKey)}</p>
        </div>

        <div className="mt-6 text-center">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-[2.75rem] font-bold tabular-nums leading-none tracking-tight text-slate-950">
              {plan.technicianPriceEurMonthly}
            </span>
            <span className="text-[1.5rem] font-semibold leading-none text-slate-950">€</span>
          </div>
          <p className="mt-2 text-[13px] text-slate-500">
            {t("subscription.pricing.per_technician")}
          </p>
        </div>

        <ul className="mt-5 space-y-2">
          {plan.featureKeys.map((key) => (
            <li key={key} className="flex items-start gap-2 text-[13px] text-slate-600">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-950" strokeWidth={2.5} />
              <span>{t(key)}</span>
            </li>
          ))}
        </ul>

        {error ? (
          <p role="alert" className="mt-4 text-center text-[12px] text-red-600">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          disabled={!checkoutEnabled || busy}
          data-testid="subscription-paywall-checkout"
          onClick={() => void handleCheckout()}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 py-3 text-[14px] font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          {busy ? t("subscription.pricing.checkout_loading") : t("subscription.paywall.cta")}
        </button>
      </div>
    </div>
  );
}
