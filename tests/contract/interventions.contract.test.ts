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
  it("accepte validated:true sans rejectionReason", () => {
    const parsed = ValidateReportRequestSchema.safeParse({ validated: true });
    expect(parsed.success).toBe(true);
  });

  it("accepte validated:false + rejectionReason", () => {
    const parsed = ValidateReportRequestSchema.safeParse({
      validated: false,
      rejectionReason: "Photos manquantes",
    });
    expect(parsed.success).toBe(true);
  });

  it("refuse rejectionReason trop court", () => {
    const parsed = ValidateReportRequestSchema.safeParse({
      validated: false,
      rejectionReason: "no",
    });
    expect(parsed.success).toBe(false);
  });

  it("réponse succès expose le status final", () => {
    const parsed = ValidateReportResponseSchema.safeParse({ ok: true, status: "invoiced" });
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
