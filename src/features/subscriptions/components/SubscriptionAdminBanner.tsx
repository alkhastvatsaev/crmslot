"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { auth } from "@/core/config/firebase";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import {
  isSubscriptionActive,
  subscriptionCheckoutEnabled,
  subscriptionEnforcementEnabled,
  useCompanySubscription,
  type SubscriptionPlanId,
} from "@/features/subscriptions";
import { isSubscriptionPlanId } from "@/features/subscriptions/subscriptionPlans";

function parsePlanFromSearchParams(): SubscriptionPlanId | null {
  if (typeof window === "undefined") return null;
  const plan = new URLSearchParams(window.location.search).get("plan")?.trim();
  return plan && isSubscriptionPlanId(plan) ? plan : null;
}

export default function SubscriptionAdminBanner() {
  const { t } = useTranslation();
  const workspace = useCompanyWorkspaceOptional();
  const { subscription, loading } = useCompanySubscription();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = workspace?.activeRole === "admin";
  const companyId = workspace?.activeCompanyId?.trim() ?? "";
  const active = isSubscriptionActive(subscription);
  const enforce = subscriptionEnforcementEnabled();
  const checkoutEnabled = subscriptionCheckoutEnabled();
  const pendingPlan = useMemo(() => parsePlanFromSearchParams(), []);

  const startCheckout = useCallback(
    async (planId: SubscriptionPlanId) => {
      if (!companyId) return;
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
          throw new Error(data.error?.trim() || "Checkout impossible.");
        }
        window.location.href = data.url;
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setBusy(false);
      }
    },
    [companyId]
  );

  const openPortal = useCallback(async () => {
    if (!companyId) return;
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
        throw new Error(data.error?.trim() || "Portail impossible.");
      }
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, [companyId]);

  if (!isAdmin || loading || !companyId) return null;
  if (active && !enforce) return null;

  if (active && enforce) return null;

  const planToOffer = pendingPlan ?? "team";

  return (
    <div
      className={[
        "relative z-[120] mx-auto max-w-5xl px-3 pt-2",
        enforce ? "pointer-events-auto" : "",
      ].join(" ")}
      data-testid="subscription-admin-banner"
    >
      <div
        className={[
          "rounded-2xl border px-4 py-3 shadow-lg backdrop-blur-md",
          enforce
            ? "border-amber-500/40 bg-amber-950/90 text-amber-50"
            : "border-emerald-500/30 bg-emerald-950/80 text-emerald-50",
        ].join(" ")}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold">
              {enforce
                ? t("subscription.banner.enforce_title")
                : t("subscription.banner.soft_title")}
            </p>
            <p className="mt-1 text-xs opacity-90">
              {enforce ? t("subscription.banner.enforce_hint") : t("subscription.banner.soft_hint")}
            </p>
            {error ? <p className="mt-2 text-xs text-red-200">{error}</p> : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {checkoutEnabled ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void startCheckout(planToOffer)}
                className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-900 disabled:opacity-60"
              >
                {busy ? t("subscription.banner.loading") : t("subscription.banner.subscribe")}
              </button>
            ) : null}
            {subscription?.stripeCustomerId ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void openPortal()}
                className="rounded-lg border border-white/20 px-3 py-2 text-xs font-medium disabled:opacity-60"
              >
                {t("subscription.banner.manage")}
              </button>
            ) : null}
            <Link
              href="/pricing"
              className="rounded-lg border border-white/20 px-3 py-2 text-xs font-medium"
            >
              {t("subscription.banner.view_pricing")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
