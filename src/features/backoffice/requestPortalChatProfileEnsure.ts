import type { User } from "firebase/auth";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";

/** Profil portail via Admin SDK — contourne règles client / App Check sur l’écriture profil. */
export async function requestPortalChatProfileEnsure(user: User, companyId: string): Promise<void> {
  const trimmed = companyId.trim();
  if (!trimmed) return;

  const res = await fetchWithAuth(
    "/api/portal-chat/ensure-profile",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId: trimmed }),
    },
    { user }
  );

  if (res.ok) return;

  const payload = (await res.json().catch(() => ({}))) as { error?: string };
  const message = payload.error?.trim() || "Échec initialisation profil chat.";
  const err = new Error(message) as Error & { code?: string };
  if (res.status === 403) err.code = "permission-denied";
  throw err;
}
