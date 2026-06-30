/**
 * @jest-environment node
 */
import {
  DocumentPdfQuerySchema,
  InterventionStatusSchema,
  ValidateReportRequestSchema,
  ValidateReportResponseSchema,
} from "@/core/api/schemas/interventions";

describe("contract /api/interventions/[id]/document-pdf?type=…", () => {
  it("type=invoice par défaut", () => {
    const parsed = DocumentPdfQuerySchema.parse({});
    expect(parsed.type).toBe("invoice");
  });

  it("accepte report / invoice / quote", () => {
    for (const t of ["report", "invoice", "quote"] as const) {
      expect(DocumentPdfQuerySchema.safeParse({ type: t }).success).toBe(true);
    }
  });

  it("refuse type=blabla", () => {
    expect(DocumentPdfQuerySchema.safeParse({ type: "blabla" }).success).toBe(false);
  });
});

describe("contract /api/interventions/[id]/validate-report", () => {
  it("accepte un corps vide (sendEmail par défaut côté serveur)", () => {
    const parsed = ValidateReportRequestSchema.safeParse({});
    expect(parsed.success).toBe(true);
  });

  it("accepte sendEmail:false pour désactiver l'envoi client", () => {
    const parsed = ValidateReportRequestSchema.safeParse({ sendEmail: false });
    expect(parsed.success).toBe(true);
  });

  it("refuse sendEmail non booléen", () => {
    const parsed = ValidateReportRequestSchema.safeParse({ sendEmail: "yes" });
    expect(parsed.success).toBe(false);
  });

  it("réponse succès expose la facture émise", () => {
    const parsed = ValidateReportResponseSchema.safeParse({
      ok: true,
      invoicePdfUrl: "https://storage.example/inv.pdf",
      invoiceAmountCents: 12000,
      emailSent: true,
    });
    expect(parsed.success).toBe(true);
  });

  it("réponse échec expose error", () => {
    const parsed = ValidateReportResponseSchema.safeParse({ ok: false, error: "report missing" });
    expect(parsed.success).toBe(true);
  });
});

describe("InterventionStatusSchema garde-fou (régression: nouveau statut sans schema)", () => {
  it.each([
    "draft",
    "to_assign",
    "assigned",
    "en_route",
    "on_site",
    "waiting_material",
    "done",
    "invoiced",
    "cancelled",
  ])("accepte %s", (s) => {
    expect(InterventionStatusSchema.safeParse(s).success).toBe(true);
  });

  it("refuse un statut hors enum (force la mise à jour du schéma)", () => {
    expect(InterventionStatusSchema.safeParse("scheduled").success).toBe(false);
  });
});
