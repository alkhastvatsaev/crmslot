import { validateRequesterInterventionSubmit } from "@/features/interventions/requesterInterventionSubmitValidation";

const t = (key: string) => key;

const baseRequest = {
  problemTemplateId: "tpl",
  problemLabel: "Porte",
  description: "",
  urgency: false,
  photoDataUrls: [] as string[],
  interventionAddress: "Rue Test 1, Bruxelles",
  interventionDate: "",
  interventionTime: "",
  audioBlob: null,
  audioUrl: null,
};

describe("validateRequesterInterventionSubmit focusMobileRail", () => {
  it("focuses left dock when particulier profile is incomplete", () => {
    const result = validateRequesterInterventionSubmit({
      profile: {
        type: "particulier",
        firstName: "",
        lastName: "Dupont",
        companyName: "",
        phone: "0470123456",
        email: "a@b.com",
        usualAddress: "",
        accessCode: "",
      },
      clientAccountFields: null,
      requestData: baseRequest,
      tenantCompanyId: null,
      interventionCompanyId: "co-1",
      isTenantUser: false,
      t,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.focusMobileRail).toBe("left");
    expect(result.triggerValidation).toBe(true);
  });

  it("focuses center dock when address is missing", () => {
    const result = validateRequesterInterventionSubmit({
      profile: {
        type: "particulier",
        firstName: "Jean",
        lastName: "Dupont",
        companyName: "",
        phone: "0470123456",
        email: "a@b.com",
        usualAddress: "",
        accessCode: "",
      },
      clientAccountFields: null,
      requestData: { ...baseRequest, interventionAddress: "" },
      tenantCompanyId: null,
      interventionCompanyId: "co-1",
      isTenantUser: false,
      t,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.focusMobileRail).toBe("center");
  });
});
