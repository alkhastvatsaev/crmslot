import type { CompanyStaffMember } from "@/features/teamHub/types";
import {
  isTechnicianPlaceholderLabel,
  resolveTechnicianAuthUid,
  resolveTechnicianProfileLabel,
} from "@/features/technicians/resolveTechnicianIdentity";
import type { Technician } from "@/features/technicians";

type StaffDisplayEntry = {
  displayName: string;
  email?: string | null;
};

export function buildStaffDisplayLookup(
  staffMembers: CompanyStaffMember[]
): Map<string, StaffDisplayEntry> {
  const map = new Map<string, StaffDisplayEntry>();
  for (const member of staffMembers) {
    const entry: StaffDisplayEntry = {
      displayName: member.displayName,
      email: member.email,
    };
    const uid = member.uid.trim();
    if (uid) map.set(uid, entry);
    const authUid = member.authUid?.trim();
    if (authUid) map.set(authUid, entry);
  }
  return map;
}

export function resolvePatronTechnicianDisplayName(
  uid: string,
  tech: Technician | undefined,
  staffLookup: Map<string, StaffDisplayEntry>
): string {
  const keys = new Set<string>([uid.trim()]);
  if (tech?.id.trim()) keys.add(tech.id.trim());
  const authUid = tech ? resolveTechnicianAuthUid(tech) : "";
  if (authUid) keys.add(authUid);

  for (const key of keys) {
    const staff = staffLookup.get(key);
    const displayName = staff?.displayName?.trim() ?? "";
    if (displayName && !isTechnicianPlaceholderLabel(displayName)) {
      return displayName;
    }
  }

  const staff =
    staffLookup.get(uid.trim()) ??
    (tech?.id.trim() ? staffLookup.get(tech.id.trim()) : undefined) ??
    (authUid ? staffLookup.get(authUid) : undefined);

  return resolveTechnicianProfileLabel(tech, {
    displayName: staff?.displayName,
    email: staff?.email ?? tech?.email ?? undefined,
  });
}
