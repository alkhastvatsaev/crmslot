/** @jest-environment node */

import {
  buildInterventionInvoiceEmailBody,
  interventionClientRecipient,
} from "@/features/interventions/server/interventionInvoiceEmail";
import type { Intervention } from "@/features/interventions/types";

describe("interventionInvoiceEmail", () => {
  it("extrait l'e-mail client valide", () => {
    const iv = {
      clientEmail: " Client@Example.COM ",
    } as Intervention;
    expect(interventionClientRecipient(iv)).toBe("client@example.com");
  });

  it("inclut le suivi portail et le lien de paiement", () => {
    const body = buildInterventionInvoiceEmailBody({
      clientLabel: "Dupont",
      portalUrl: "https://app.example/suivi/token-1",
      paymentLinkUrl: "https://pay.stripe.com/link-1",
    });
    expect(body).toContain("Suivi en ligne : https://app.example/suivi/token-1");
    expect(body).toContain("Payer en ligne (carte bancaire) : https://pay.stripe.com/link-1");
  });
});
