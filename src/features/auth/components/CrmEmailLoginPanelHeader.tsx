"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslation } from "@/core/i18n/I18nContext";
import {
  crmEmailLoginSubtitleKey,
  crmEmailLoginTitleKey,
  type CrmEmailLoginVariant,
} from "@/features/auth/crmEmailLoginVariant";
import {
  getSubscriptionPlan,
  readPendingSubscriptionPlan,
  readPlanIdFromSearchParams,
  savePendingSubscriptionPlan,
  type SubscriptionPlanId,
} from "@/features/subscriptions";

type Props = {
  variant: CrmEmailLoginVariant;
};

export default function CrmEmailLoginPanelHeader({ variant }: Props) {
  const { t } = useTranslation();
  const [pendingPlanId, setPendingPlanId] = useState<SubscriptionPlanId | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = readPlanIdFromSearchParams(params);
    if (fromUrl) savePendingSubscriptionPlan(fromUrl);
    setPendingPlanId(readPendingSubscriptionPlan());
  }, []);

  const pendingPlan = pendingPlanId ? getSubscriptionPlan(pendingPlanId) : null;

  return (
    <div className="flex flex-col items-center gap-3">
      <Image
        src="/icon-192.png"
        alt="CRMSLOT"
        width={56}
        height={56}
        className="h-14 w-14 rounded-2xl shadow-sm"
        priority
      />
      <div className="text-center">
        <h1 className="text-[17px] font-semibold tracking-tight text-slate-900">
          {t(crmEmailLoginTitleKey(variant))}
        </h1>
        {pendingPlan ? (
          <p className="mt-2 inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[12px] font-medium text-blue-700">
            {t(pendingPlan.nameKey)} · {pendingPlan.priceEurMonthly} €
            {t("subscription.pricing.per_month")}
          </p>
        ) : (
          <p className="mt-1 text-[12.5px] leading-snug text-slate-500">
            {t(crmEmailLoginSubtitleKey(variant))}
          </p>
        )}
      </div>
    </div>
  );
}
