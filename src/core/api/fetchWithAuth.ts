import { auth } from "@/core/config/firebase";

/** En-têtes avec jeton Firebase (utilisateur anonyme ou connecté). */
export async function authHeaders(
  extra?: Record<string, string>,
): Promise<Record<string, string>> {
  const headers: Record<string, string> = { ...extra };
  if (auth?.currentUser) {
    try {
      headers.Authorization = `Bearer ${await auth.currentUser.getIdToken()}`;
    } catch {
      /* refresh échoué */
    }
  }
  return headers;
}

/** `fetch` avec `Authorization: Bearer` pour les routes API protégées. */
export async function fetchWithAuth(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const merged = await authHeaders(
    init?.headers instanceof Headers
      ? Object.fromEntries(init.headers.entries())
      : Array.isArray(init?.headers)
        ? Object.fromEntries(init.headers)
        : (init?.headers as Record<string, string> | undefined),
  );
  return fetch(input, {
    ...init,
    credentials: init?.credentials ?? "same-origin",
    headers: merged,
  });
}
