import type { User } from "firebase/auth";
import { auth } from "@/core/config/firebase";

export type FetchWithAuthOptions = {
  /** Utilisateur Firebase dont le jeton doit être envoyé (ex. portail client). */
  user?: User | null;
};

function mergeInitHeaders(init?: RequestInit): Record<string, string> | undefined {
  if (!init?.headers) return undefined;
  if (init.headers instanceof Headers) return Object.fromEntries(init.headers.entries());
  if (Array.isArray(init.headers)) return Object.fromEntries(init.headers);
  return init.headers as Record<string, string>;
}

/** En-têtes avec jeton Firebase (utilisateur anonyme ou connecté). */
export async function authHeaders(
  extra?: Record<string, string>,
  options?: FetchWithAuthOptions
): Promise<Record<string, string>> {
  const headers: Record<string, string> = { ...extra };
  const tokenUser = options?.user ?? auth?.currentUser ?? null;
  if (tokenUser) {
    try {
      headers.Authorization = `Bearer ${await tokenUser.getIdToken(false)}`;
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
  options?: FetchWithAuthOptions
): Promise<Response> {
  const merged = await authHeaders(mergeInitHeaders(init), options);
  return fetch(input, {
    ...init,
    credentials: init?.credentials ?? "same-origin",
    headers: merged,
  });
}
