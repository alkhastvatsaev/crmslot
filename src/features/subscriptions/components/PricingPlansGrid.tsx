"use client";

import { useCallback, useState } from "react";
import { auth } from "@/core/config/firebase";
import { useTranslation } from "@/core/i18n/I18nContext";
import {
  SUBSCRIPTION_PLANS,
  subscriptionCheckoutEnabled,
  type SubscriptionPlanId,
} from "@/features/subscriptions";

type Props = {
  defaultPlanId?: SubscriptionPlanId;
};

export default function PricingPlansGrid({ defaultPlanId }: Props) {
  const { t } = useTranslation();
  const checkoutEnabled = subscriptionCheckoutEnabled();
  const [busyPlan, setBusyPlan] = useState<SubscriptionPlanId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChoose = useCallback(
    async (planId: SubscriptionPlanId) => {
      setError(null);
      const user = auth?.currentUser;
      if (!user) {
        window.location.href = `/?plan=${planId}&auth=register`;
        return;
      }

      setBusyPlan(planId);
      try {
        const idToken = await user.getIdToken();
        const res = await fetch("/api/subscriptions/checkout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ planId }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          url?: string;
          error?: string;
          needsCompany?: boolean;
        };

        if (data.needsCompany) {
          window.location.href = `/?plan=${planId}&setup=company`;
          return;
        }

        if (!res.ok || !data.url) {
          throw new Error(data.error?.trim() || t("subscription.pricing.checkout_error"));
        }

        window.location.href = data.url;
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setBusyPlan(null);
      }
    },
    [t]
  );

  return (
    <div className="w-full max-w-3xl">
      <div className="mb-8 text-center">
        <h1 className="text-[22px] font-semibold tracking-tight text-slate-900">
          {t("subscription.pricing.title")}
        </h1>
        <p className="mt-1.5 text-[13px] text-slate-500">{t("subscription.pricing.subtitle")}</p>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-center text-[13px] text-red-700">
          {error}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {SUBSCRIPTION_PLANS.map((plan) => {
          const selected = defaultPlanId === plan.id;
          const highlighted = plan.highlight === true;

          return (
            <div
              key={plan.id}
              className={[
                "flex flex-col rounded-2xl border bg-white/95 p-5 shadow-[0_12px_40px_-16px_rgba(15,23,42,0.12)] backdrop-blur-xl transition-shadow",
                highlighted ? "border-blue-200 ring-1 ring-blue-500/20" : "border-slate-200/80",
                selected ? "ring-2 ring-blue-500/30" : "",
              ].join(" ")}
            >
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="text-[15px] font-semibold text-slate-800">{t(plan.nameKey)}</h2>
                {highlighted ? (
                  <span className="text-[10px] font-medium uppercase tracking-wide text-blue-600">
                    {t("subscription.pricing.recommended")}
                  </span>
                ) : null}
              </div>

              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-[28px] font-bold tabular-nums tracking-tight text-slate-900">
                  {plan.priceEurMonthly}
                </span>
                <span className="text-[13px] text-slate-500">
                  € {t("subscription.pricing.per_month")}
                </span>
              </div>

              <p className="mt-2 min-h-[20px] text-[12px] text-slate-500">{t(plan.taglineKey)}</p>

              <button
                type="button"
                disabled={!checkoutEnabled || busyPlan !== null}
                onClick={() => void handleChoose(plan.id)}
                className={[
                  "mt-5 w-full rounded-xl py-2.5 text-[13px] font-semibold transition active:scale-[0.99] disabled:opacity-50",
                  highlighted
                    ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700"
                    : "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
                ].join(" ")}
              >
                {busyPlan === plan.id
                  ? t("subscription.pricing.checkout_loading")
                  : t("subscription.pricing.cta")}
              </button>
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-center text-[11px] text-slate-400">
        {t("subscription.pricing.footnote")}
      </p>
    </div>
  );
}
