"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useTranslation } from "@/core/i18n/I18nContext";
import { clearPendingSubscriptionPlan } from "@/features/subscriptions/pendingSubscriptionPlan";
import { isSubscriptionPlanId } from "@/features/subscriptions/subscriptionPlans";

function SubscriptionCheckoutReturnEffectsInner() {
  const searchParams = useSearchParams();
  const { t } = useTranslation();

  useEffect(() => {
    const subscription = searchParams.get("subscription")?.trim();
    if (!subscription) return;

    if (subscription === "success") {
      clearPendingSubscriptionPlan();
      const plan = searchParams.get("plan")?.trim();
      const planLabel =
        plan && isSubscriptionPlanId(plan)
          ? t(`subscription.plans.${plan}.name`)
          : t("subscription.account.activate");
      toast.success(t("subscription.checkout.success_title"), {
        description: t("subscription.checkout.success_hint").replace("{{plan}}", planLabel),
      });
    }

    if (subscription === "portal_return") {
      toast.message(t("subscription.checkout.portal_return"));
    }
  }, [searchParams, t]);

  return null;
}

/** Toasts après retour Stripe Checkout / Billing Portal. */
export default function SubscriptionCheckoutReturnEffects() {
  return (
    <Suspense fallback={null}>
      <SubscriptionCheckoutReturnEffectsInner />
    </Suspense>
  );
}
