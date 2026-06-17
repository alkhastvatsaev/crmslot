import type { User } from "firebase/auth";
import { resolveStaffJoinPayload, type StaffJoinPayload } from "@/features/auth/staffJoinPayload";

export type DefaultCompanyMembershipResult =
  | { ok: true; companyId: string }
  | { ok: false; error: string };

function buildJoinDefaultBody(payload: StaffJoinPayload, user: User): string {
  if (payload.staffKind === "technician") {
    return JSON.stringify({
      staffKind: "technician",
      firstName: payload.firstName ?? "",
      lastName: payload.lastName ?? "",
      email: payload.email ?? user.email ?? null,
    });
  }
  return JSON.stringify({ staffKind: "admin" });
}

/** Rattache le compte staff à la société unique (API Admin). */
export async function requestDefaultCompanyMembership(
  user: User,
  payloadOverride?: StaffJoinPayload | null
): Promise<DefaultCompanyMembershipResult> {
  const payload = resolveStaffJoinPayload(payloadOverride);
  const idToken = await user.getIdToken();
  const res = await fetch("/api/company/join-default", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: buildJoinDefaultBody(payload, user),
  });
  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    companyId?: string;
    error?: string;
  };

  if (!res.ok || !data.ok || !data.companyId) {
    return {
      ok: false,
      error:
        typeof data.error === "string" && data.error.trim()
          ? data.error.trim()
          : "Impossible de rattacher le compte à la société.",
    };
  }

  await user.getIdToken(true);
  return { ok: true, companyId: data.companyId };
}
