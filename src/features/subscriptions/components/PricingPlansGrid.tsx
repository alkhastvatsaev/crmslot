"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/core/config/firebase";
import { useTranslation } from "@/core/i18n/I18nContext";
import {
  EXTRA_TECHNICIAN_PRICE_EUR,
  SUBSCRIPTION_PLANS,
  savePendingSubscriptionPlan,
  subscriptionCheckoutEnabled,
  type SubscriptionPlanId,
} from "@/features/subscriptions";
import { startSubscriptionCheckout } from "@/features/subscriptions/startSubscriptionCheckoutClient";

type Props = {
  defaultPlanId?: SubscriptionPlanId;
  showAppLink?: boolean;
};

export default function PricingPlansGrid({ defaultPlanId, showAppLink = true }: Props) {
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
      <div className="mb-10 text-center">
        <p className="text-[13px] font-medium text-blue-600">
          {t("subscription.pricing.founding_badge")}
        </p>
        <h1 className="mt-3 text-[clamp(1.75rem,4vw,2.5rem)] font-semibold tracking-tight text-slate-900">
          {t("subscription.pricing.title")}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-slate-500">
          {t("subscription.pricing.subtitle")}
        </p>
      </div>

      {error ? (
        <p
          role="alert"
          className="mx-auto mb-6 max-w-lg rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-[13px] text-red-700"
        >
          {error}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
        {SUBSCRIPTION_PLANS.map((plan) => {
          const selected = defaultPlanId === plan.id;
          const highlighted = plan.highlight === true;

          return (
            <div
              key={plan.id}
              className={[
                "relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md",
                highlighted ? "border-slate-900 ring-1 ring-slate-900/10" : "border-slate-200",
                selected ? "ring-2 ring-blue-500/40" : "",
              ].join(" ")}
            >
              {highlighted ? (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-slate-900 px-3 py-0.5 text-[11px] font-semibold text-white">
                  {t("subscription.pricing.most_popular")}
                </span>
              ) : null}

              <div>
                <h2 className="text-[17px] font-semibold text-slate-900">{t(plan.nameKey)}</h2>
                <p className="mt-1 text-[13px] text-slate-500">{t(plan.taglineKey)}</p>
              </div>

              <div className="mt-5 flex items-baseline gap-1.5">
                <span className="text-[2.5rem] font-bold tabular-nums leading-none tracking-tight text-slate-900">
                  {plan.priceEurMonthly}
                </span>
                <span className="text-[14px] text-slate-500">
                  €{t("subscription.pricing.per_month")}
                </span>
              </div>

              <p className="mt-2 text-[12px] text-emerald-700">
                {t("subscription.pricing.founding_price").replace(
                  "{{price}}",
                  String(plan.foundingPriceEurMonthly)
                )}
              </p>

              <p className="mt-3 text-[13px] font-medium text-slate-700">
                {t("subscription.pricing.seats_included").replace(
                  "{{count}}",
                  String(plan.technicianSeatsIncluded)
                )}
              </p>

              <ul className="mt-5 flex-1 space-y-2.5">
                {plan.featureKeys.map((key) => (
                  <li key={key} className="flex items-start gap-2.5 text-[13px] text-slate-600">
                    <Check
                      className="mt-0.5 h-4 w-4 shrink-0 text-slate-900"
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
                  "mt-6 w-full rounded-xl py-3 text-[14px] font-semibold transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50",
                  highlighted
                    ? "bg-slate-900 text-white hover:bg-slate-800"
                    : "border border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
                ].join(" ")}
              >
                {ctaLabel(plan.id)}
              </button>
            </div>
          );
        })}
      </div>

      <p className="mt-8 text-center text-[13px] text-slate-500">
        {t("subscription.pricing.extra_technician").replace(
          "{{price}}",
          String(EXTRA_TECHNICIAN_PRICE_EUR)
        )}
      </p>

      <p className="mt-3 text-center text-[12px] text-slate-400">
        {t("subscription.pricing.footnote")}
      </p>

      {showAppLink ? (
        <p className="mt-6 text-center text-[13px] text-slate-500">
          {t("subscription.pricing.already_account")}{" "}
          <Link href="/" className="font-medium text-slate-900 underline-offset-2 hover:underline">
            {signedIn ? t("subscription.pricing.open_app") : t("subscription.pricing.sign_in")}
          </Link>
        </p>
      ) : null}
    </div>
  );
}
