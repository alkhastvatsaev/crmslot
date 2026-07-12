"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useTranslation } from "@/core/i18n/I18nContext";

function PricingPageEffectsInner() {
  const searchParams = useSearchParams();
  const { t } = useTranslation();

  useEffect(() => {
    if (searchParams.get("canceled") !== "1") return;

    toast.message(t("subscription.checkout.canceled"));

    const url = new URL(window.location.href);
    url.searchParams.delete("canceled");
    const next = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState(window.history.state, "", next);
  }, [searchParams, t]);

  return null;
}

export default function PricingPageEffects() {
  return (
    <Suspense fallback={null}>
      <PricingPageEffectsInner />
    </Suspense>
  );
}
