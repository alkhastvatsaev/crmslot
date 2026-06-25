import {
  canResolveTechnicianAssignUid,
  resolveTechnicianAssignUid,
} from "@/features/dispatch/technicianAssignUid";
import type { Technician } from "@/features/technicians/types";

export function resolveTechnicianAuthUid(tech: Technician): string {
  const authUid = (tech.authUid ?? "").trim();
  if (authUid) return authUid;
  if (canResolveTechnicianAssignUid(tech)) {
    try {
      return resolveTechnicianAssignUid(tech);
    } catch {
      return "";
    }
  }
  return "";
}

/** Retrouve un technicien par id doc Firestore, UID Firebase Auth ou e-mail. */
export function findTechnicianByAssignUid(
  technicians: Technician[],
  uid: string,
  options?: { email?: string }
): Technician | undefined {
  const trimmed = uid.trim();
  if (trimmed) {
    const byUid = technicians.find((tech) => {
      const docId = tech.id.trim();
      if (docId === trimmed) return true;
      return resolveTechnicianAuthUid(tech) === trimmed;
    });
    if (byUid) return byUid;
  }

  const email = options?.email?.trim().toLowerCase();
  if (!email) return undefined;
  return technicians.find((tech) => tech.email?.trim().toLowerCase() === email);
}

export function resolveTechnicianProfileLabel(
  tech: Technician | null | undefined,
  fallback?: { displayName?: string; email?: string }
): string {
  const name = tech?.name?.trim();
  if (name) return name;

  const full = [tech?.firstName, tech?.lastName].filter(Boolean).join(" ").trim();
  if (full) return full;

  const authName = fallback?.displayName?.trim();
  if (authName) return authName;

  const email = (tech?.email ?? fallback?.email ?? "").trim();
  if (email) {
    const local = email.split("@")[0]?.trim();
    if (local) return local;
  }

  return "Technicien";
}

export function technicianProfileInitial(
  tech: Technician | null | undefined,
  label: string
): string {
  const initial = tech?.initial?.trim();
  if (initial) return initial;
  return (label.trim().charAt(0) || "T").toUpperCase();
}

export function buildTechnicianDocIdToAuthUidMap(technicians: Technician[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const tech of technicians) {
    const docId = tech.id.trim();
    const authUid = resolveTechnicianAuthUid(tech);
    if (docId && authUid && docId !== authUid) {
      map.set(docId, authUid);
    }
  }
  return map;
}

export function resolveAssignedTechnicianUid(
  rawUid: string,
  docIdToAuthUid: Map<string, string>
): string {
  const trimmed = rawUid.trim();
  return docIdToAuthUid.get(trimmed) ?? trimmed;
}

export function isTechnicianUidFallbackLabel(name: string, uid: string): boolean {
  const trimmed = uid.trim();
  if (!trimmed) return false;
  const label = name.trim();
  return label === trimmed.slice(-6) || label === trimmed.slice(0, 8);
}
