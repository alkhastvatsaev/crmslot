"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useFeatureFlag } from "@/core/useFeatureFlags";
import type { Intervention } from "@/features/interventions/types";
import {
  checklistForIntervention,
  isChecklistComplete,
} from "@/features/interventions/categoryChecklist";

type Props = {
  intervention: Pick<Intervention, "category">;
  onCompleteChange: (complete: boolean) => void;
  /** Une rangée compacte sans titre (wizard terrain). */
  compact?: boolean;
};

export default function CategoryFinishChecklist({
  intervention,
  onCompleteChange,
  compact = false,
}: Props) {
  const { t } = useTranslation();
  const enabled = useFeatureFlag("pwaV2Bundle");
  const items = useMemo(() => checklistForIntervention(intervention), [intervention]);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!enabled) {
      onCompleteChange(true);
      return;
    }
    onCompleteChange(isChecklistComplete(checked, items));
  }, [enabled, checked, items, onCompleteChange]);

  if (!enabled) return null;

  const toggle = (id: string) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (compact) {
    return (
      <section
        data-testid="category-finish-checklist"
        className="flex shrink-0 gap-2 overflow-x-auto rounded-xl border border-slate-200/80 bg-slate-50 px-2 py-1.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {items.map((item) => (
          <label
            key={item.id}
            className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-white px-2 py-1 text-[11px] font-medium text-slate-700 ring-1 ring-slate-200/80"
          >
            <input
              type="checkbox"
              data-testid={`finish-checklist-${item.id}`}
              checked={Boolean(checked[item.id])}
              onChange={() => toggle(item.id)}
              className="h-3.5 w-3.5 rounded border-slate-300"
            />
            <span className="max-w-[7rem] truncate">{t(item.labelKey)}</span>
          </label>
        ))}
      </section>
    );
  }

  return (
    <section data-testid="category-finish-checklist" className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="mb-2 text-xs font-bold uppercase text-slate-500">{t("finish_checklist.title")}</p>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                data-testid={`finish-checklist-${item.id}`}
                checked={Boolean(checked[item.id])}
                onChange={() => toggle(item.id)}
                className="h-4 w-4 rounded border-slate-300"
              />
              {t(item.labelKey)}
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}
