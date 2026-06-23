"use client";

import { useTranslation } from "@/core/i18n/I18nContext";
import { HUB_TYPE } from "@/core/ui/hub";
import { formatAddress } from "@/utils/stringUtils";
import type { Intervention } from "@/features/interventions/types";

type Props = {
  selectedItem: Intervention;
};

export default function InterventionDetailAddressSection({ selectedItem }: Props) {
  const { t } = useTranslation();

  return (
    <div className="space-y-1">
      <span className={HUB_TYPE.eyebrow}>{t("backoffice.inbox.location")}</span>
      <p className="text-[15px] font-semibold text-slate-800">
        {formatAddress(selectedItem.address)}
      </p>
    </div>
  );
}
