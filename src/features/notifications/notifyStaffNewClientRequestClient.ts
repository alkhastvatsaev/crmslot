import type { User } from "firebase/auth";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";

/** Déclenche la push staff après création client-side (entreprise, smart form, widget). */
export function notifyStaffNewClientRequestClient(params: {
  companyId: string;
  interventionId: string;
  title?: string | null;
  address?: string | null;
  user?: User | null;
}): void {
  const companyId = params.companyId.trim();
  const interventionId = params.interventionId.trim();
  if (!companyId || !interventionId) return;

  void fetchWithAuth(
    "/api/notifications/staff-new-request",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyId,
        interventionId,
        title: params.title?.trim() || undefined,
        address: params.address?.trim() || undefined,
      }),
    },
    { user: params.user ?? undefined }
  ).catch(() => null);
}
