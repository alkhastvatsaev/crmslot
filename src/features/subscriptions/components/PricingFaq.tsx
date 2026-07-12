"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";

const FAQ_KEYS = ["plan", "trial", "technicians", "billing"] as const;

export default function PricingFaq() {
  const { t } = useTranslation();
  const [openKey, setOpenKey] = useState<string | null>(FAQ_KEYS[0]);

  return (
    <section className="mx-auto w-full max-w-2xl">
      <h2 className="text-center text-[22px] font-semibold tracking-tight text-slate-900">
        {t("subscription.pricing.faq_title")}
      </h2>

      <div className="mt-8 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
        {FAQ_KEYS.map((key) => {
          const open = openKey === key;
          return (
            <div key={key}>
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpenKey(open ? null : key)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <span className="text-[14px] font-medium text-slate-900">
                  {t(`subscription.pricing.faq.${key}.q`)}
                </span>
                <ChevronDown
                  className={[
                    "h-4 w-4 shrink-0 text-slate-400 transition-transform",
                    open ? "rotate-180" : "",
                  ].join(" ")}
                  aria-hidden
                />
              </button>
              {open ? (
                <p className="px-5 pb-4 text-[13px] leading-relaxed text-slate-600">
                  {t(`subscription.pricing.faq.${key}.a`)}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
