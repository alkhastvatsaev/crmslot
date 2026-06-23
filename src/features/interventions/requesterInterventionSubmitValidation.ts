import type { ClientPortalAccountFields } from "@/features/auth";
import {
  resolveAccountFieldsForSubmit,
  validateClientPortalAccountFields,
} from "@/features/auth/clientPortalAccountProfile";
import { clientPortalAuth } from "@/core/config/firebase";
import type { InterventionRequestData, RequesterProfile } from "@/context/RequesterHubContext";
import { isValidPortalEmail } from "@/features/interventions/portalEmail";
import { REQUESTER_GEOLOC_ADDRESS_PENDING } from "@/features/interventions/smartInterventionConstants";

export type RequesterInterventionSubmitInput = {
  profile: RequesterProfile;
  clientAccountFields: ClientPortalAccountFields | null;
  requestData: InterventionRequestData;
  tenantCompanyId: string | null;
  interventionCompanyId: string | null;
  isTenantUser: boolean;
  locale: string;
  t: (key: string) => string;
  triggerValidation: () => void;
  setIsSubmitting: (v: boolean) => void;
  setLastSubmittedInterventionId: (id: string) => void;
  setPendingTrackingInterventionId: (id: string | null) => void;
  setPortalRightTab: (
    tab: "tracking" | "chat" | "invoice" | "documents" | "timeline" | null
  ) => void;
  setLastSubmittedRequest: (request: InterventionRequestData | null) => void;
  resetRequestAfterSubmit: () => void;
  setLastSubmittedPortalAccessCode: (code: string) => void;
  onInboxPendingId?: (id: string) => void;
  onNavigateMap?: () => void;
};

export type RequesterSubmitValidationFailure = {
  ok: false;
  message: string;
  triggerValidation?: boolean;
};

export type RequesterSubmitValidationSuccess = { ok: true };

export type RequesterSubmitValidationResult =
  | RequesterSubmitValidationSuccess
  | RequesterSubmitValidationFailure;

export function validateRequesterInterventionSubmit(params: {
  profile: RequesterProfile;
  clientAccountFields: ClientPortalAccountFields | null;
  requestData: InterventionRequestData;
  tenantCompanyId: string | null;
  interventionCompanyId: string | null;
  isTenantUser: boolean;
  t: (key: string) => string;
}): RequesterSubmitValidationResult {
  const {
    profile,
    clientAccountFields,
    requestData,
    tenantCompanyId,
    interventionCompanyId,
    isTenantUser,
    t,
  } = params;

  const { problemLabel, description, interventionAddress } = requestData;

  if (profile.type !== "particulier") {
    const u = clientPortalAuth?.currentUser;
    if (!u || u.isAnonymous || !u.emailVerified) {
      return {
        ok: false,
        message: String(t("requester.toasts.fill_left_panel")),
        triggerValidation: true,
      };
    }

    const accountFields = resolveAccountFieldsForSubmit(clientAccountFields, profile, u.email);
    if (validateClientPortalAccountFields(accountFields).length > 0) {
      return {
        ok: false,
        message: String(t("requester.toasts.fill_account_profile")),
        triggerValidation: true,
      };
    }
  } else {
    const missingProfileFields: string[] = [];
    if (!profile.firstName.trim()) missingProfileFields.push("firstName");
    if (!profile.lastName.trim()) missingProfileFields.push("lastName");
    if (!profile.phone.trim()) missingProfileFields.push("phone");
    if (!profile.email.trim()) missingProfileFields.push("email");

    if (missingProfileFields.length > 0) {
      return {
        ok: false,
        message: String(t("requester.toasts.fill_left_panel")),
        triggerValidation: true,
      };
    }

    if (!isValidPortalEmail(profile.email)) {
      return {
        ok: false,
        message: String(t("requester.toasts.email_invalid")),
        triggerValidation: true,
      };
    }
  }

  if (!interventionAddress.trim()) {
    return { ok: false, message: String(t("requester.toasts.address_required")) };
  }
  if (interventionAddress === REQUESTER_GEOLOC_ADDRESS_PENDING) {
    return { ok: false, message: String(t("requester.toasts.address_searching")) };
  }
  if (!problemLabel.trim() && !description.trim()) {
    return { ok: false, message: String(t("requester.toasts.problem_required")) };
  }
  if (isTenantUser && !tenantCompanyId) {
    return { ok: false, message: String(t("requester.toasts.company_required")) };
  }
  if (!interventionCompanyId) {
    return { ok: false, message: String(t("requester.toasts.company_required")) };
  }

  return { ok: true };
}
