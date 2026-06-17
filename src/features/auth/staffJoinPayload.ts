import type { User } from "firebase/auth";
import type { CrmEmailLoginVariant } from "@/features/auth/crmEmailLoginVariant";

export type StaffKind = "admin" | "technician";

export type StaffJoinPayload = {
  staffKind: StaffKind;
  firstName?: string;
  lastName?: string;
  email?: string | null;
};

const STAFF_JOIN_STORAGE_KEY = "crmslot_staff_join_payload";

export function parseDisplayName(displayName: string | null | undefined): {
  firstName: string;
  lastName: string;
} {
  const parts = (displayName ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0] ?? "", lastName: "" };
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}

export function staffJoinPayloadFromVariant(
  variant: CrmEmailLoginVariant,
  profile?: { firstName?: string; lastName?: string; email?: string | null }
): StaffJoinPayload {
  if (variant === "technician") {
    return {
      staffKind: "technician",
      firstName: profile?.firstName?.trim() ?? "",
      lastName: profile?.lastName?.trim() ?? "",
      email: profile?.email?.trim() ?? null,
    };
  }
  return { staffKind: "admin" };
}

export function staffJoinPayloadFromOAuthUser(
  variant: CrmEmailLoginVariant,
  user: Pick<User, "email" | "displayName">
): StaffJoinPayload {
  const { firstName, lastName } = parseDisplayName(user.displayName);
  return staffJoinPayloadFromVariant(variant, {
    firstName,
    lastName,
    email: user.email,
  });
}

export function persistStaffJoinPayload(payload: StaffJoinPayload): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STAFF_JOIN_STORAGE_KEY, JSON.stringify(payload));
}

export function readStaffJoinPayload(): StaffJoinPayload | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(STAFF_JOIN_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<StaffJoinPayload>;
    if (parsed.staffKind !== "admin" && parsed.staffKind !== "technician") return null;
    return {
      staffKind: parsed.staffKind,
      firstName: typeof parsed.firstName === "string" ? parsed.firstName : "",
      lastName: typeof parsed.lastName === "string" ? parsed.lastName : "",
      email: typeof parsed.email === "string" ? parsed.email : null,
    };
  } catch {
    return null;
  }
}

export function resolveStaffJoinPayload(override?: StaffJoinPayload | null): StaffJoinPayload {
  return override ?? readStaffJoinPayload() ?? { staffKind: "admin" };
}
