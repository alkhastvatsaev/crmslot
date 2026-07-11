"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { auth } from "@/core/config/firebase";
import { useTranslation } from "@/core/i18n/I18nContext";
import {
  EXTRA_TECHNICIAN_PRICE_EUR,
  SUBSCRIPTION_PLANS,
  subscriptionCheckoutEnabled,
  type SubscriptionPlanId,
} from "@/features/subscriptions";

type Props = {
  /** Plan pré-sélectionné (depuis /pricing ou ?plan=). */
  defaultPlanId?: SubscriptionPlanId;
  /** Afficher le lien vers l'app si déjà connecté. */
  showAppLink?: boolean;
};

async function startCheckout(planId: SubscriptionPlanId, companyId: string): Promise<string> {
  const user = auth?.currentUser;
  if (!user) throw new Error("Connexion requise.");

  const idToken = await user.getIdToken();
  const res = await fetch("/api/subscriptions/checkout", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ companyId, planId }),
  });
  const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!res.ok || !data.url) {
    throw new Error(data.error?.trim() || "Impossible de démarrer le paiement.");
  }
  return data.url;
}

export default function PricingPlansGrid({ defaultPlanId, showAppLink = true }: Props) {
  const { t } = useTranslation();
  const checkoutEnabled = subscriptionCheckoutEnabled();
  const [busyPlan, setBusyPlan] = useState<SubscriptionPlanId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChoose = useCallback(async (planId: SubscriptionPlanId) => {
    setError(null);
    const user = auth?.currentUser;
    if (!user) {
      window.location.href = `/?plan=${planId}&auth=register`;
      return;
    }

    setBusyPlan(planId);
    try {
      const idToken = await user.getIdToken();
      const meRes = await fetch("/api/subscriptions/checkout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planId }),
      });
      const meData = (await meRes.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
        needsCompany?: boolean;
      };

      if (meData.needsCompany) {
        window.location.href = `/?plan=${planId}&setup=company`;
        return;
      }

      if (!meRes.ok || !meData.url) {
        throw new Error(meData.error?.trim() || "Checkout impossible.");
      }

      window.location.href = meData.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyPlan(null);
    }
  }, []);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <p className="text-sm font-medium text-emerald-400">
          {t("subscription.pricing.founding_badge")}
        </p>
        <h2 className="mt-2 text-3xl font-bold text-white">{t("subscription.pricing.title")}</h2>
        <p className="mt-3 text-slate-400 max-w-2xl mx-auto">
          {t("subscription.pricing.subtitle")}
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200 text-center">
          {error}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {SUBSCRIPTION_PLANS.map((plan) => {
          const selected = defaultPlanId === plan.id;
          return (
            <div
              key={plan.id}
              className={[
                "relative flex flex-col rounded-2xl border p-6 backdrop-blur-md",
                plan.highlight
                  ? "border-emerald-500/40 bg-emerald-500/10"
                  : "border-white/10 bg-white/5",
                selected ? "ring-2 ring-emerald-400/60" : "",
              ].join(" ")}
            >
              {plan.highlight ? (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-3 py-0.5 text-xs font-semibold text-slate-950">
                  {t("subscription.pricing.most_popular")}
                </span>
              ) : null}

              <h3 className="text-lg font-semibold text-white">{t(plan.nameKey)}</h3>
              <div className="mt-4 flex items-end gap-2">
                <span className="text-4xl font-bold text-white">{plan.priceEurMonthly} €</span>
                <span className="pb-1 text-sm text-slate-400">
                  {t("subscription.pricing.per_month")}
                </span>
              </div>
              <p className="mt-1 text-xs text-emerald-300">
                {t("subscription.pricing.founding_price").replace(
                  "{{price}}",
                  String(plan.foundingPriceEurMonthly)
                )}
              </p>
              <p className="mt-3 text-sm text-slate-400">
                {t("subscription.pricing.seats_included").replace(
                  "{{count}}",
                  String(plan.technicianSeatsIncluded)
                )}
              </p>

              <ul className="mt-5 flex-1 space-y-2">
                {plan.featureKeys.map((key) => (
                  <li key={key} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                    {t(key)}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                disabled={!checkoutEnabled || busyPlan !== null}
                onClick={() => void handleChoose(plan.id)}
                className={[
                  "mt-6 w-full rounded-xl px-4 py-3 text-sm font-semibold transition-opacity",
                  plan.highlight
                    ? "bg-emerald-500 text-slate-950 hover:opacity-90"
                    : "bg-white text-slate-900 hover:bg-slate-100",
                  !checkoutEnabled || busyPlan !== null ? "opacity-60 cursor-not-allowed" : "",
                ].join(" ")}
              >
                {busyPlan === plan.id
                  ? t("subscription.pricing.checkout_loading")
                  : t("subscription.pricing.choose_plan")}
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-center text-sm text-slate-500">
        {t("subscription.pricing.extra_technician").replace(
          "{{price}}",
          String(EXTRA_TECHNICIAN_PRICE_EUR)
        )}
      </p>

      {showAppLink ? (
        <p className="text-center text-sm text-slate-400">
          {t("subscription.pricing.already_account")}{" "}
          <Link href="/" className="text-emerald-400 underline-offset-2 hover:underline">
            {t("subscription.pricing.open_app")}
          </Link>
        </p>
      ) : null}
    </div>
  );
}

export { startCheckout };
