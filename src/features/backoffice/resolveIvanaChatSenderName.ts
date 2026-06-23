import type { User } from "firebase/auth";
import type { CrmStaffAccountFields } from "@/features/auth";
import type { ClientPortalAccountFields } from "@/features/auth";
import type { RequesterProfile } from "@/features/interventions/context/RequesterHubContext";

type Params = {
  publishAsPortal: boolean;
  user: User;
  staffFields?: CrmStaffAccountFields | null;
  clientAccountFields?: ClientPortalAccountFields | null;
  requesterProfile?: RequesterProfile | null;
  t: (key: string) => string;
};

/** Nom affiché dans les bulles — figé à l'envoi. */
export function resolveIvanaChatSenderName({
  publishAsPortal,
  user,
  staffFields,
  clientAccountFields,
  requesterProfile,
  t,
}: Params): string {
  if (publishAsPortal) {
    const fromAccount = [
      clientAccountFields?.firstName?.trim(),
      clientAccountFields?.lastName?.trim(),
    ]
      .filter(Boolean)
      .join(" ")
      .trim();
    const fromProfile = [requesterProfile?.firstName?.trim(), requesterProfile?.lastName?.trim()]
      .filter(Boolean)
      .join(" ")
      .trim();
    return (
      fromAccount ||
      fromProfile ||
      user.displayName?.trim() ||
      user.email?.split("@")[0]?.trim() ||
      String(t("chat.role_client"))
    );
  }

  const staffName = [staffFields?.firstName?.trim(), staffFields?.lastName?.trim()]
    .filter(Boolean)
    .join(" ")
    .trim();
  return (
    staffName || user.displayName?.trim() || user.email?.trim() || String(t("chat.role_staff"))
  );
}
