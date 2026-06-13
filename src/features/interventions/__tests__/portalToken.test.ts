import { generatePortalAccessToken, toPortalSummary } from "../portalToken";
import type { Intervention } from "../types";

function iv(partial: Partial<Intervention> = {}): Intervention {
  return {
    id: "iv-1",
    title: "Porte claquée",
    address: "Rue Haute 12, Bruxelles",
    time: "10:00",
    status: "invoiced",
    location: { lat: 50.8, lng: 4.35 },
    ...partial,
  } as Intervention;
}

describe("generatePortalAccessToken", () => {
  it("génère un token unique non vide", () => {
    const a = generatePortalAccessToken();
    const b = generatePortalAccessToken();
    expect(a.length).toBeGreaterThan(10);
    expect(a).not.toBe(b);
  });
});

describe("toPortalSummary", () => {
  it("expose montant et lien de paiement quand facturé", () => {
    const summary = toPortalSummary(
      iv({
        invoiceAmountCents: 12500,
        stripePaymentLinkUrl: "https://pay.stripe.com/abc",
        paymentStatus: "pending",
      })
    );
    expect(summary.invoiceAmountCents).toBe(12500);
    expect(summary.paymentLinkUrl).toBe("https://pay.stripe.com/abc");
    expect(summary.paymentStatus).toBe("pending");
    expect(summary.quotes).toEqual([]);
  });

  it("montant null si non facturé", () => {
    const summary = toPortalSummary(iv({ status: "in_progress" }));
    expect(summary.invoiceAmountCents).toBeNull();
    expect(summary.paymentLinkUrl).toBeNull();
  });

  it("n'expose jamais d'UID ni de téléphone", () => {
    const summary = toPortalSummary(
      iv({
        createdByUid: "uid-secret",
        clientPhone: "+32470000000",
        assignedTechnicianUid: "tech-uid",
      } as Partial<Intervention>)
    );
    const json = JSON.stringify(summary);
    expect(json).not.toContain("uid-secret");
    expect(json).not.toContain("+32470000000");
    expect(json).not.toContain("tech-uid");
  });
});
