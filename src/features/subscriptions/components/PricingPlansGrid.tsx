"use client";

import { useCallback, useEffect, useState } from "react";
import { Check } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/core/config/firebase";
import { useTranslation } from "@/core/i18n/I18nContext";
import {
  SUBSCRIPTION_PLANS,
  savePendingSubscriptionPlan,
  subscriptionCheckoutEnabled,
  type SubscriptionPlanId,
} from "@/features/subscriptions";
import { startSubscriptionCheckout } from "@/features/subscriptions/startSubscriptionCheckoutClient";

type Props = {
  defaultPlanId?: SubscriptionPlanId;
};

export default function PricingPlansGrid({ defaultPlanId }: Props) {
  const { t } = useTranslation();
  const checkoutEnabled = subscriptionCheckoutEnabled();
  const [busyPlan, setBusyPlan] = useState<SubscriptionPlanId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    if (!auth) return () => {};
    setSignedIn(Boolean(auth.currentUser));
    return onAuthStateChanged(auth, (user) => setSignedIn(Boolean(user)));
  }, []);

  const handleChoose = useCallback(async (planId: SubscriptionPlanId) => {
    setError(null);
    savePendingSubscriptionPlan(planId);

    const user = auth?.currentUser;
    if (!user) {
      window.location.href = `/?auth=register&plan=${planId}`;
      return;
    }

    setBusyPlan(planId);
    try {
      const url = await startSubscriptionCheckout(planId);
      window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyPlan(null);
    }
  }, []);

  const ctaLabel = (planId: SubscriptionPlanId) => {
    if (busyPlan === planId) return t("subscription.pricing.checkout_loading");
    return signedIn ? t("subscription.pricing.cta_subscribe") : t("subscription.pricing.cta");
  };

  return (
    <div className="w-full">
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

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {SUBSCRIPTION_PLANS.map((plan) => {
          const selected = defaultPlanId === plan.id;
          const highlighted = plan.highlight === true;
          const visibleFeatureKeys = plan.featureKeys.slice(0, 2);

          return (
            <div
              key={plan.id}
              className={[
                "relative flex min-h-0 flex-col rounded-[1.35rem] border bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5",
                highlighted ? "border-slate-950 ring-1 ring-slate-950/10" : "border-slate-200",
                selected ? "ring-2 ring-blue-500/40" : "",
              ].join(" ")}
            >
              {highlighted ? (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-slate-900 px-3 py-0.5 text-[11px] font-semibold text-white">
                  {t("subscription.pricing.most_popular")}
                </span>
              ) : null}

              <div>
                <h2 className="text-[16px] font-semibold text-slate-950">{t(plan.nameKey)}</h2>
                <p className="mt-1 text-[12px] text-slate-500">{t(plan.taglineKey)}</p>
              </div>

              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="text-[2.15rem] font-bold tabular-nums leading-none tracking-tight text-slate-950">
                  {plan.technicianPriceEurMonthly}
                </span>
                <span className="text-[12px] text-slate-500">
                  €{t("subscription.pricing.per_technician")}
                </span>
              </div>

              <ul className="mt-4 flex-1 space-y-2">
                {visibleFeatureKeys.map((key) => (
                  <li key={key} className="flex items-start gap-2 text-[12.5px] text-slate-600">
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
                disabled={!checkoutEnabled || busyPlan !== null}
                onClick={() => void handleChoose(plan.id)}
                className={[
                  "mt-5 w-full rounded-xl py-2.5 text-[13px] font-semibold transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50",
                  highlighted
                    ? "bg-slate-950 text-white hover:bg-slate-800"
                    : "border border-slate-200 bg-white text-slate-950 hover:bg-slate-50",
                ].join(" ")}
              >
                {ctaLabel(plan.id)}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
