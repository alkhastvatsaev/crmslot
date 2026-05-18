import type { Intervention } from "./types";

export type ChecklistItem = {
  id: string;
  labelKey: string;
};

const SERRURERIE: ChecklistItem[] = [
  { id: "photos", labelKey: "finish_checklist.photos" },
  { id: "lock_ok", labelKey: "finish_checklist.lock_ok" },
  { id: "client_informed", labelKey: "finish_checklist.client_informed" },
];

const AUTRE: ChecklistItem[] = [
  { id: "photos", labelKey: "finish_checklist.photos" },
  { id: "site_safe", labelKey: "finish_checklist.site_safe" },
  { id: "client_informed", labelKey: "finish_checklist.client_informed" },
];

export function checklistForIntervention(iv: Pick<Intervention, "category">): ChecklistItem[] {
  return iv.category === "serrurerie" ? SERRURERIE : AUTRE;
}

export function isChecklistComplete(checked: Record<string, boolean>, items: ChecklistItem[]): boolean {
  return items.every((item) => Boolean(checked[item.id]));
}
