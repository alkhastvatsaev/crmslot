"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";
import { SUBSCRIPTION_PLANS } from "@/features/subscriptions";
import { markPendingSubscriptionCheckout } from "@/features/subscriptions/pendingSubscriptionPlan";

/** Landing publique minimaliste — redirige vers inscription / connexion. */
export default function PricingLanding() {
  const { t } = useTranslation();
  const plan = SUBSCRIPTION_PLANS[0];

  return (
    <div className="mx-auto w-full max-w-md text-center">
      <h1 className="text-[clamp(1.7rem,4vw,2.35rem)] font-semibold tracking-tight text-slate-950">
        {t("subscription.pricing.title")}
      </h1>
      <p className="mt-2 text-[14px] text-slate-500">{t("subscription.paywall.subtitle")}</p>

      <div className="mt-8 rounded-[1.35rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-[2.75rem] font-bold tabular-nums leading-none text-slate-950">
            {plan.technicianPriceEurMonthly}
          </span>
          <span className="text-[1.5rem] font-semibold leading-none text-slate-950">€</span>
        </div>
        <p className="mt-2 text-[13px] text-slate-500">
          {t("subscription.pricing.per_technician")}
        </p>

        <ul className="mt-5 space-y-2 text-left">
          {plan.featureKeys.map((key) => (
            <li key={key} className="flex items-start gap-2 text-[13px] text-slate-600">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-950" strokeWidth={2.5} />
              <span>{t(key)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
        <Link
          href="/?auth=register"
          onClick={() => markPendingSubscriptionCheckout()}
          data-testid="pricing-landing-register"
          className="rounded-xl bg-slate-950 px-5 py-3 text-[14px] font-semibold text-white transition hover:bg-slate-800"
        >
          {t("auth.register_tab")}
        </Link>
        <Link
          href="/?auth=login"
          data-testid="pricing-landing-login"
          className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-[14px] font-semibold text-slate-800 transition hover:bg-slate-50"
        >
          {t("auth.login_tab")}
        </Link>
      </div>
    </div>
  );
}
