import {
  buildClientIntakeFields,
  buildTechnicianReportFields,
  clientIntakePhotoUrls,
  technicianCompletionPhotoUrls,
} from "@/features/planningHub/planningInterventionDetailFields";
import type { Intervention } from "@/features/interventions";

const baseIv = {
  id: "iv-1",
  title: "Porte bloquée",
  address: "Rue 1",
  status: "done",
  time: "09:00",
  location: { lat: 0, lng: 0 },
} satisfies Intervention;

describe("planningInterventionDetailFields", () => {
  it("collects client form fields", () => {
    const fields = buildClientIntakeFields({
      ...baseIv,
      clientFirstName: "Marie",
      clientLastName: "Dupont",
      clientPhone: "+32 470 00 00 00",
      clientEmail: "marie@example.com",
      problem: "Serrure cassée",
      category: "serrurerie",
      urgency: true,
      requestedDate: "2026-06-19",
      requestedTime: "14:00",
      transcription: "Le client ne peut plus ouvrir.",
      attachmentThumbnails: ["https://cdn/a.jpg", "https://cdn/b.jpg"],
    });

    expect(fields.map((f) => f.id)).toEqual(
      expect.arrayContaining([
        "name",
        "phone",
        "email",
        "address",
        "category",
        "urgency",
        "problem",
        "requested",
        "transcription",
        "client_photos",
      ])
    );
    expect(fields.find((f) => f.id === "client_photos")?.value).toBe("2");
  });

  it("collects technician report fields", () => {
    const fields = buildTechnicianReportFields({
      ...baseIv,
      scheduledDate: "2026-06-19",
      scheduledTime: "14:00",
      technicianAcceptedAt: "2026-06-19T13:00:00Z",
      completedAt: "2026-06-19T15:30:00Z",
      actualDurationMinutes: 90,
      billingLines: [{ description: "Main d'oeuvre", quantity: 1, unitPriceCents: 8500 }],
      invoiceAmountCents: 8500,
      completionSignatureUrl: "https://cdn/sign.png",
      completionPhotos: [{ url: "https://cdn/done.jpg", category: "preuve" }],
    });

    expect(fields.map((f) => f.id)).toEqual(
      expect.arrayContaining([
        "status",
        "scheduled",
        "accepted",
        "completed",
        "duration",
        "billing",
        "invoice",
        "signature",
        "completion_photos",
      ])
    );
  });

  it("extracts photo urls", () => {
    expect(
      clientIntakePhotoUrls({
        ...baseIv,
        attachmentThumbnails: ["a", "b"],
      })
    ).toEqual(["a", "b"]);
    expect(
      technicianCompletionPhotoUrls({
        ...baseIv,
        completionPhotos: [{ url: "x", category: "preuve" }],
      })
    ).toEqual(["x"]);
  });

  it("handles Firestore-like raw values without crashing", () => {
    const iv = {
      ...baseIv,
      clientName: 12345 as unknown as string,
      phone: 470123456 as unknown as string,
      technicianAcceptedAt: {
        toDate: () => new Date("2026-06-19T10:00:00Z"),
      } as unknown as string,
      billingLines: [
        { description: "MO", quantity: 1, unitPriceCents: undefined as unknown as number },
      ],
    };

    expect(() => buildClientIntakeFields(iv)).not.toThrow();
    const techFields = buildTechnicianReportFields(iv);
    expect(techFields.some((f) => f.id === "accepted")).toBe(true);
    expect(techFields.find((f) => f.id === "billing")?.value).toContain("MO");
  });
});
