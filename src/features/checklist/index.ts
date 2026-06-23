/**
 * API publique checklist — Firestore checklist intervention (flag pwaV2).
 */
export type { ChecklistItem, InterventionChecklist } from "@/features/checklist/types";
export {
  DEFAULT_CHECKLIST_ITEMS,
  buildDefaultChecklist,
  isChecklistComplete,
  checklistProgress,
} from "@/features/checklist/types";
export {
  subscribeChecklist,
  createChecklist,
  updateChecklistItem,
} from "@/features/checklist/checklistFirestore";
