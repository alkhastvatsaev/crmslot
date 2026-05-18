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
};

export default function CategoryFinishChecklist({ intervention, onCompleteChange }: Props) {
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
