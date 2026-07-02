import type { InterventionRequestData, RequesterProfile } from "@/context/RequesterHubContext";
import { clientPortalAuth } from "@/core/config/firebase";
import { isValidPortalEmail } from "@/features/interventions/portalEmail";
import { REQUESTER_GEOLOC_ADDRESS_PENDING } from "@/features/interventions/smartInterventionConstants";

export type RequesterSubmitReadiness = {
  profile: boolean;
  problem: boolean;
  address: boolean;
  profileSubmitHintKey: string | null;
};

export function isRequesterProfileComplete(profile: RequesterProfile): boolean {
  if (profile.type === "particulier") {
    return (
      profile.firstName.trim().length > 0 &&
      profile.lastName.trim().length > 0 &&
      profile.phone.trim().length > 0 &&
      profile.email.trim().length > 0 &&
      isValidPortalEmail(profile.email)
    );
  }

  const u = clientPortalAuth?.currentUser;
  return Boolean(u && !u.isAnonymous && u.emailVerified);
}

export function isRequesterProblemComplete(
  requestData: Pick<InterventionRequestData, "problemLabel" | "description">
): boolean {
  return Boolean(requestData.problemLabel.trim() || requestData.description.trim());
}

export function isRequesterAddressComplete(
  requestData: Pick<InterventionRequestData, "interventionAddress">
): boolean {
  const address = requestData.interventionAddress.trim();
  return address.length > 0 && address !== REQUESTER_GEOLOC_ADDRESS_PENDING;
}

export function computeRequesterSubmitReadiness(params: {
  profile: RequesterProfile;
  requestData: Pick<
    InterventionRequestData,
    "problemLabel" | "description" | "interventionAddress"
  >;
}): RequesterSubmitReadiness {
  const profileOk = isRequesterProfileComplete(params.profile);
  const problemOk = isRequesterProblemComplete(params.requestData);
  const addressOk = isRequesterAddressComplete(params.requestData);

  let profileSubmitHintKey: string | null = null;
  if (profileOk && !problemOk) {
    profileSubmitHintKey = "requester.ux.profile_submit_need_problem";
  } else if (profileOk && problemOk && !addressOk) {
    profileSubmitHintKey = "requester.ux.profile_submit_need_address";
  }

  return {
    profile: profileOk,
    problem: problemOk,
    address: addressOk,
    profileSubmitHintKey,
  };
}
