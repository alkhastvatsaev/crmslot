"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useDashboardPagerOptional } from "@/features/dashboard/dashboardPagerContext";
import { COMPANY_HUB_PAGE_INDEX } from "@/features/company/companyHubConstants";
import { navigateCompanyHub, COMPANY_HUB_ANCHOR_CLIENT_PORTAL } from "@/features/company/companyHubNavigation";

/** Retour Stripe après paiement — toast + hub société (onglet suivi). */
export default function ClientPortalPaymentReturnEffects() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pager = useDashboardPagerOptional();
  const { t } = useTranslation();
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    if (searchParams.get("payment") !== "success") return;

    handledRef.current = true;
    toast.success(String(t("payment.return_success")));

    pager?.setPageIndex(COMPANY_HUB_PAGE_INDEX);
    navigateCompanyHub(pager, COMPANY_HUB_ANCHOR_CLIENT_PORTAL);

    const next = new URLSearchParams(searchParams.toString());
    next.delete("payment");
    next.delete("interventionId");
    const qs = next.toString();
    router.replace(qs ? `?${qs}` : window.location.pathname, { scroll: false });
  }, [searchParams, router, pager, t]);

  return null;
}
