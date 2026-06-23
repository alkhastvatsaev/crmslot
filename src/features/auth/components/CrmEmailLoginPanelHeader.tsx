"use client";

import Image from "next/image";
import { useTranslation } from "@/core/i18n/I18nContext";
import {
  crmEmailLoginSubtitleKey,
  crmEmailLoginTitleKey,
  type CrmEmailLoginVariant,
} from "@/features/auth/crmEmailLoginVariant";

type Props = {
  variant: CrmEmailLoginVariant;
};

export default function CrmEmailLoginPanelHeader({ variant }: Props) {
  const { t } = useTranslation();

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
        <p className="mt-1 text-[12.5px] leading-snug text-slate-500">
          {t(crmEmailLoginSubtitleKey(variant))}
        </p>
      </div>
    </div>
  );
}
