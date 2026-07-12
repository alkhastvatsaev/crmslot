"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/core/config/firebase";
import { useTranslation } from "@/core/i18n/I18nContext";
import {
  readPlanIdFromSearchParams,
  savePendingSubscriptionPlan,
} from "@/features/subscriptions/pendingSubscriptionPlan";

function buildAuthHref(tab: "login" | "register", planId: string | null): string {
  const next = new URLSearchParams();
  next.set("auth", tab);
  if (planId) next.set("plan", planId);
  return `/?${next.toString()}`;
}

/** Liens Connexion / Créer un compte — haut à droite de /pricing. */
function PricingAuthToolbarInner() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const [signedIn, setSignedIn] = useState(false);

  const planId = useMemo(() => readPlanIdFromSearchParams(searchParams), [searchParams]);
  const loginHref = useMemo(() => buildAuthHref("login", planId), [planId]);
  const registerHref = useMemo(() => buildAuthHref("register", planId), [planId]);

  useEffect(() => {
    if (!auth) return () => {};
    setSignedIn(Boolean(auth.currentUser));
    return onAuthStateChanged(auth, (user) => setSignedIn(Boolean(user)));
  }, []);

  if (signedIn) {
    return (
      <div className="flex w-full justify-end lg:w-auto" data-testid="pricing-auth-toolbar">
        <Link
          href="/"
          className="whitespace-nowrap rounded-xl border border-slate-200 bg-white px-4 py-2 text-[13px] font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
          data-testid="pricing-auth-open-app"
        >
          {t("subscription.pricing.open_app")}
        </Link>
      </div>
    );
  }

  const persistPlan = () => {
    if (planId) savePendingSubscriptionPlan(planId);
  };

  return (
    <div
      className="flex w-full flex-wrap items-center justify-end gap-2 sm:gap-2.5"
      data-testid="pricing-auth-toolbar"
    >
      <Link
        href={loginHref}
        data-testid="pricing-auth-login"
        onClick={persistPlan}
        className="whitespace-nowrap rounded-xl border border-slate-200 bg-white px-4 py-2 text-[13px] font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
      >
        {t("auth.login_tab")}
      </Link>
      <Link
        href={registerHref}
        data-testid="pricing-auth-register"
        onClick={persistPlan}
        className="whitespace-nowrap rounded-xl bg-slate-950 px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition hover:bg-slate-800"
      >
        {t("auth.register_tab")}
      </Link>
    </div>
  );
}

export default function PricingAuthToolbar() {
  return (
    <Suspense fallback={null}>
      <PricingAuthToolbarInner />
    </Suspense>
  );
}
