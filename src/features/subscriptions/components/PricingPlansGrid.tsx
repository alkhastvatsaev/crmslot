"use client";

import { useCallback, useState } from "react";
import { Check } from "lucide-react";
import { auth } from "@/core/config/firebase";
import { useTranslation } from "@/core/i18n/I18nContext";
import {
  PUBLIC_SUBSCRIPTION_PLAN_ID,
  SUBSCRIPTION_PLANS,
  savePendingSubscriptionPlan,
  subscriptionCheckoutEnabled,
  technicianPlanAnnualTotal,
  technicianPlanDisplayPrice,
  type SubscriptionBillingInterval,
} from "@/features/subscriptions";
import PricingAuthToolbar from "@/features/subscriptions/components/PricingAuthToolbar";
import PricingBillingToggle from "@/features/subscriptions/components/PricingBillingToggle";
import { startSubscriptionCheckout } from "@/features/subscriptions/startSubscriptionCheckoutClient";

export default function PricingPlansGrid() {
  const { t } = useTranslation();
  const checkoutEnabled = subscriptionCheckoutEnabled();
  const plan = SUBSCRIPTION_PLANS[0];
  const [billingInterval, setBillingInterval] = useState<SubscriptionBillingInterval>("monthly");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayPrice = technicianPlanDisplayPrice(plan, billingInterval);
  const isYearly = billingInterval === "yearly";

  const handleChoose = useCallback(async () => {
    setError(null);
    savePendingSubscriptionPlan(PUBLIC_SUBSCRIPTION_PLAN_ID);

    const user = auth?.currentUser;
    if (!user) {
      window.location.href = `/?auth=register&plan=${PUBLIC_SUBSCRIPTION_PLAN_ID}`;
      return;
    }

    setBusy(true);
    try {
      const url = await startSubscriptionCheckout(PUBLIC_SUBSCRIPTION_PLAN_ID, { billingInterval });
      window.location.assign(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  }, [billingInterval]);

  return (
    <div className="w-full">
      <div className="mb-5 flex flex-col gap-4 lg:mb-6 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
        <PricingBillingToggle
          value={billingInterval}
          onChange={setBillingInterval}
          ariaLabel={String(t("subscription.pricing.billing_period"))}
          monthlyLabel={String(t("subscription.pricing.billing_monthly"))}
          yearlyLabel={String(t("subscription.pricing.billing_yearly"))}
        />
        <PricingAuthToolbar />
      </div>

      <div className="mb-6 text-center sm:mb-7">
        <h1 className="text-[clamp(1.7rem,4vw,2.35rem)] font-semibold tracking-tight text-slate-950">
          {t("subscription.pricing.title")}
        </h1>
      </div>

      {error ? (
        <p
          role="alert"
          className="mx-auto mb-6 max-w-lg rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-[13px] text-red-700"
        >
          {error}
        </p>
      ) : null}

      <div className="mx-auto w-full max-w-md">
        <div className="flex flex-col rounded-[1.35rem] border border-slate-950 bg-white p-5 shadow-sm ring-1 ring-slate-950/10 sm:p-6">
          <div className="text-center">
            <h2 className="text-[18px] font-semibold text-slate-950">{t(plan.nameKey)}</h2>
            <p className="mt-1 text-[13px] text-slate-500">{t(plan.taglineKey)}</p>
          </div>

          <div className="mt-5 text-center">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-[2.75rem] font-bold tabular-nums leading-none tracking-tight text-slate-950">
                {displayPrice}
              </span>
              <span className="text-[1.5rem] font-semibold leading-none text-slate-950">€</span>
            </div>
            <p className="mt-2 text-[13px] leading-snug text-slate-500">
              {isYearly
                ? t("subscription.pricing.per_technician_annual_equiv")
                : t("subscription.pricing.per_technician")}
            </p>
            {isYearly ? (
              <p className="mt-0.5 text-[12px] text-slate-400">
                {t("subscription.pricing.billed_annually").replace(
                  "{{amount}}",
                  String(technicianPlanAnnualTotal(plan))
                )}
              </p>
            ) : null}
          </div>

          <ul className="mt-5 space-y-2.5">
            {plan.featureKeys.map((key) => (
              <li key={key} className="flex items-start gap-2 text-[13px] text-slate-600">
                <Check
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-950"
                  strokeWidth={2.5}
                  aria-hidden
                />
                <span>{t(key)}</span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            disabled={!checkoutEnabled || busy}
            onClick={() => void handleChoose()}
            data-testid="pricing-choose-plan"
            className="mt-6 w-full rounded-xl bg-slate-950 py-3 text-[14px] font-semibold text-white transition hover:bg-slate-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? t("subscription.pricing.checkout_loading") : t("subscription.pricing.cta")}
          </button>
        </div>
      </div>
    </div>
  );
}
