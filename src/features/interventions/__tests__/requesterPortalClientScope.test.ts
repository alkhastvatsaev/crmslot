import {
  filterInterventionsForClientPortal,
  interventionBelongsToClientPortalIdentity,
  resolveClientPortalIdentity,
} from "@/features/interventions/requesterPortalClientScope";

describe("requesterPortalClientScope", () => {
  const rows = [
    {
      id: "iv-martin",
      clientFirstName: "Martin",
      clientLastName: "Dupont",
      clientEmail: "martin@example.com",
      clientPhone: "0470123456",
    },
    {
      id: "iv-pierre",
      clientFirstName: "Pierre",
      clientLastName: "Martin",
      clientEmail: "pierre@example.com",
      clientPhone: "0987654321",
    },
  ];

  it("filters dossiers by authenticated client email", () => {
    const identity = resolveClientPortalIdentity(
      {
        uid: "user-1",
        isAnonymous: false,
        email: "pierre@example.com",
        emailVerified: true,
      } as never,
      {
        type: "login",
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        companyName: "",
      }
    );

    const filtered = filterInterventionsForClientPortal(rows, identity);
    expect(filtered.map((row) => row.id)).toEqual(["iv-pierre"]);
  });

  it("filters guest dossiers by profile name and phone", () => {
    const identity = resolveClientPortalIdentity(null, {
      type: "particulier",
      firstName: "Martin",
      lastName: "Dupont",
      phone: "0470123456",
      email: "",
      companyName: "",
    });

    expect(interventionBelongsToClientPortalIdentity(rows[0]!, identity)).toBe(true);
    expect(interventionBelongsToClientPortalIdentity(rows[1]!, identity)).toBe(false);
  });

  it("requires login before loading login-mode dossiers", () => {
    const identity = resolveClientPortalIdentity(null, {
      type: "login",
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      companyName: "",
    });

    expect(identity.requiresLogin).toBe(true);
    expect(filterInterventionsForClientPortal(rows, identity)).toEqual([]);
  });

  it("requires verified email before loading login-mode dossiers", () => {
    const identity = resolveClientPortalIdentity(
      {
        uid: "user-1",
        isAnonymous: false,
        email: "pierre@example.com",
        emailVerified: false,
      } as never,
      {
        type: "login",
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        companyName: "",
      }
    );

    expect(identity.requiresLogin).toBe(true);
    expect(filterInterventionsForClientPortal(rows, identity)).toEqual([]);
  });
});
