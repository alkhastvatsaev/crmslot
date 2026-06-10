"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import {
  SMART_FORM_TEMPLATES,
  type SmartFormTemplate,
} from "@/features/interventions/smartInterventionConstants";

interface RequesterStepTemplatesProps {
  problemTemplateId: string | null;
  problemLabel: string;
  onSelect: (tpl: SmartFormTemplate) => void;
}

export function RequesterStepTemplates({
  problemTemplateId,
  problemLabel,
  onSelect,
}: RequesterStepTemplatesProps) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-start px-1 pt-4 pb-28">
      <h2 className="sr-only">{String(t("requester.intervention.step0_heading"))}</h2>
      <div className="-translate-y-3 grid w-full max-w-[440px] grid-cols-3 gap-3 px-1">
        {SMART_FORM_TEMPLATES.map((tpl) => {
          const selected =
            (problemTemplateId ? problemTemplateId === tpl.id : false) ||
            (!problemTemplateId &&
              (problemLabel === tpl.label || problemLabel === String(t(tpl.label))));
          return (
            <motion.button
              key={tpl.id}
              type="button"
              data-testid={`smart-form-template-${tpl.id}`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onSelect(tpl)}
              className={cn(
                "group relative flex w-full aspect-square flex-col items-center justify-center p-1 text-center outline-none rounded-[22px] transition-all duration-200",
                selected
                  ? "bg-white border border-blue-200 text-slate-800 shadow-[0_4px_20px_-4px_rgba(59,130,246,0.45)]"
                  : "bg-white border border-black/5 hover:border-blue-200 hover:shadow-[0_4px_20px_-4px_rgba(59,130,246,0.45)] text-slate-800 shadow-sm"
              )}
            >
              <div className="flex flex-col items-center justify-center gap-1">
                {tpl.labelLines ? (
                  <>
                    <span className="text-sm font-bold tracking-tight leading-snug">
                      {t(tpl.labelLines[0])}
                    </span>
                    <span className="text-sm font-bold tracking-tight leading-snug">
                      {t(tpl.labelLines[1])}
                    </span>
                  </>
                ) : (
                  <span className="text-sm font-bold tracking-tight leading-snug line-clamp-3">
                    {t(tpl.label)}
                  </span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
