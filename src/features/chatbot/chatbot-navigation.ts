import { BACKOFFICE_HUB_SLOT_INDEX } from "@/features/backoffice/backofficeHubConstants";
import type { DashboardPagerApi } from "@/features/dashboard/dashboardPagerContext";

/** Ouvre un dossier dans le hub back-office (page 4 carrousel). */
export function openInterventionFromChatbot(
  pager: DashboardPagerApi | null | undefined,
  setPendingInboxId: ((id: string | null) => void) | undefined,
  interventionId: string,
): void {
  const id = interventionId.trim();
  if (!id) return;
  pager?.setPageIndex(BACKOFFICE_HUB_SLOT_INDEX);
  setPendingInboxId?.(id);
}
