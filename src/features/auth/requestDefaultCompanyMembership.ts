import type { User } from "firebase/auth";

export type DefaultCompanyMembershipResult =
  | { ok: true; companyId: string }
  | { ok: false; error: string };

/** Rattache le compte staff à la société unique (API Admin). */
export async function requestDefaultCompanyMembership(
  user: User
): Promise<DefaultCompanyMembershipResult> {
  const idToken = await user.getIdToken();
  const res = await fetch("/api/company/join-default", {
    method: "POST",
    headers: { Authorization: `Bearer ${idToken}` },
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
