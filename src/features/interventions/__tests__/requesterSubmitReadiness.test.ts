import {
  computeRequesterSubmitReadiness,
  isRequesterProfileComplete,
  isRequesterProblemComplete,
  isRequesterAddressComplete,
} from "@/features/interventions/requesterSubmitReadiness";
import type { RequesterProfile } from "@/context/RequesterHubContext";

const particulierProfile: RequesterProfile = {
  type: "particulier",
  firstName: "Jean",
  lastName: "Dupont",
  companyName: "",
  phone: "+32 470 00 00 00",
  email: "jean@example.com",
  usualAddress: "",
  accessCode: "",
};

describe("requesterSubmitReadiness", () => {
  it("marque le profil particulier complet", () => {
    expect(isRequesterProfileComplete(particulierProfile)).toBe(true);
  });

  it("exige problème ou description", () => {
    expect(isRequesterProblemComplete({ problemLabel: "", description: "" })).toBe(false);
    expect(isRequesterProblemComplete({ problemLabel: "Fuite", description: "" })).toBe(true);
  });

  it("exige adresse confirmée pour l'étape lieu", () => {
    expect(isRequesterAddressComplete({ interventionAddress: "Rue Test 1" }, false)).toBe(false);
    expect(isRequesterAddressComplete({ interventionAddress: "Rue Test 1" }, true)).toBe(true);
  });

  it("bloque le bouton profil si le centre est incomplet", () => {
    const ready = computeRequesterSubmitReadiness({
      profile: particulierProfile,
      requestData: {
        problemLabel: "",
        description: "",
        interventionAddress: "",
      },
    });
    expect(ready.profile).toBe(true);
    expect(ready.profileSubmitHintKey).toBe("requester.ux.profile_submit_need_problem");
  });
});
