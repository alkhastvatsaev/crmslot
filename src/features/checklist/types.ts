export interface ChecklistItem {
  id: string;
  label: string;
  required: boolean;
  checked: boolean;
  checkedAt?: string | null;
  checkedByUid?: string | null;
}

export interface InterventionChecklist {
  id: string;
  interventionId: string;
  companyId: string;
  items: ChecklistItem[];
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_CHECKLIST_ITEMS: Omit<ChecklistItem, "id" | "checked" | "checkedAt" | "checkedByUid">[] = [
  { label: "Photos avant travaux prises", required: true },
  { label: "EPI portés (gants, lunettes)", required: true },
  { label: "Zone de travail sécurisée", required: true },
  { label: "Client informé du devis/tarif", required: false },
  { label: "Matériel vérifié et conforme", required: true },
  { label: "Photos après travaux prises", required: true },
  { label: "Zone nettoyée", required: false },
  { label: "Client satisfait et signataire", required: true },
];

export function buildDefaultChecklist(
  interventionId: string,
  companyId: string,
): Omit<InterventionChecklist, "id" | "createdAt" | "updatedAt"> {
  return {
    interventionId,
    companyId,
    completedAt: null,
    items: DEFAULT_CHECKLIST_ITEMS.map((item, i) => ({
      ...item,
      id: `item-${i}`,
      checked: false,
      checkedAt: null,
      checkedByUid: null,
    })),
  };
}

export function isChecklistComplete(checklist: InterventionChecklist): boolean {
  return checklist.items.filter((i) => i.required).every((i) => i.checked);
}

export function checklistProgress(checklist: InterventionChecklist): { done: number; total: number } {
  return {
    done: checklist.items.filter((i) => i.checked).length,
    total: checklist.items.length,
  };
}
