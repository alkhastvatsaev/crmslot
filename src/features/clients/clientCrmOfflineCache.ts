import type { ClientRecord } from "./types";

const STORAGE_PREFIX = "belgmap_crm_clients_";

export function readClientsOfflineCache(companyId: string): ClientRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${companyId.trim()}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as ClientRecord[]) : [];
  } catch {
    return [];
  }
}

export function writeClientsOfflineCache(companyId: string, clients: ClientRecord[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${companyId.trim()}`, JSON.stringify(clients.slice(0, 200)));
  } catch {
    /* quota */
  }
}

export function clearClientsOfflineCache(companyId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${companyId.trim()}`);
  } catch {
    /* ignore */
  }
}
