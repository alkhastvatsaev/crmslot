"use client";

import { useCallback, useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { auth } from "@/core/config/firebase";
import { useTranslation } from "@/core/i18n/I18nContext";
import {
  getSubscriptionPlan,
  isSubscriptionActive,
  readPendingSubscriptionPlan,
  subscriptionCheckoutEnabled,
  useCompanySubscription,
  type SubscriptionPlanId,
} from "@/features/subscriptions";

type Props = {
  companyId: string;
};

export default function AccountSubscriptionRow({ companyId }: Props) {
  const { t } = useTranslation();
  const { subscription, loading } = useCompanySubscription();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pendingPlanId = readPendingSubscriptionPlan();
  const active = isSubscriptionActive(subscription);
  const displayPlanId: SubscriptionPlanId | null = subscription?.planId ?? pendingPlanId ?? null;

  const startCheckout = useCallback(
    async (planId: SubscriptionPlanId) => {
      if (!companyId.trim()) return;
      const user = auth?.currentUser;
      if (!user) return;

      setBusy(true);
      setError(null);
      try {
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
          throw new Error(data.error?.trim() || t("subscription.pricing.checkout_error"));
        }
        window.location.href = data.url;
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setBusy(false);
      }
    },
    [companyId, t]
  );

  const openPortal = useCallback(async () => {
    if (!companyId.trim()) return;
    const user = auth?.currentUser;
    if (!user) return;

    setBusy(true);
    setError(null);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/subscriptions/portal", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ companyId }),
      });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error?.trim() || t("subscription.account.portal_error"));
      }
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, [companyId, t]);

  if (loading) return null;
  if (!displayPlanId && !active) return null;

  const plan = displayPlanId ? getSubscriptionPlan(displayPlanId) : null;
  const statusKey = subscription?.status ?? "none";
  const showActivate =
    !active && displayPlanId && subscriptionCheckoutEnabled() && Boolean(companyId.trim());
  const showManage = Boolean(subscription?.stripeCustomerId);

  return (
    <div
      data-testid="dashboard-account-subscription"
      className="flex flex-col gap-2 rounded-[20px] border border-black/[0.05] bg-white/70 p-2.5 shadow-[0_12px_32px_-24px_rgba(15,23,42,0.18)]"
    >
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/95 text-slate-500 shadow-[0_3px_10px_-5px_rgba(15,23,42,0.1)]">
          <CreditCard className="h-4 w-4 opacity-70" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          {plan ? (
            <p className="truncate text-sm font-medium text-slate-900">
              {t(plan.nameKey)} · {plan.priceEurMonthly} €
              <span className="text-slate-500"> {t("subscription.pricing.per_month")}</span>
            </p>
          ) : null}
          <p className="text-[11px] font-medium text-slate-500">
            {t(`subscription.account.status.${statusKey}`)}
          </p>
        </div>
      </div>

      {error ? <p className="text-[11px] text-red-600">{error}</p> : null}

      {showActivate || showManage ? (
        <div className="flex gap-2">
          {showActivate && displayPlanId ? (
            <button
              type="button"
              disabled={busy}
              data-testid="dashboard-account-subscribe"
              onClick={() => void startCheckout(displayPlanId)}
              className="flex min-h-[36px] flex-1 items-center justify-center gap-1.5 rounded-full bg-blue-600 px-3.5 text-[13px] font-semibold text-white disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : null}
              {t("subscription.account.activate")}
            </button>
          ) : null}
          {showManage ? (
            <button
              type="button"
              disabled={busy}
              data-testid="dashboard-account-manage-subscription"
              onClick={() => void openPortal()}
              className="flex min-h-[36px] flex-1 items-center justify-center rounded-full border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-800 disabled:opacity-50"
            >
              {t("subscription.account.manage")}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
