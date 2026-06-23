import {
  ADMIN_MOBILE_FULL_CRM_QUERY,
  buildFullCrmMobileHref,
  prefersFullCrmOnMobile,
} from "@/features/dashboard/adminMobileFullCrm";

describe("adminMobileFullCrm", () => {
  it("détecte fullCrm=1", () => {
    expect(prefersFullCrmOnMobile(`?${ADMIN_MOBILE_FULL_CRM_QUERY}=1`)).toBe(true);
    expect(prefersFullCrmOnMobile("")).toBe(false);
  });

  it("construit le lien vers le carrousel complet", () => {
    expect(buildFullCrmMobileHref()).toBe("/?fullCrm=1");
  });
});
