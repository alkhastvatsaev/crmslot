import {
  canTechnicianAmendCompletionReport,
  finishWizardBillingLinesFromIntervention,
  finishWizardPhotosFromIntervention,
} from "@/features/interventions/technicianCompletionReport";
import type { Intervention } from "@/features/interventions/types";

function iv(partial: Partial<Intervention> = {}): Intervention {
  return {
    id: "iv-1",
    title: "Test",
    address: "Rue 1",
    time: "10:00",
    status: "done",
    assignedTechnicianUid: "tech-1",
    location: { lat: 50.8, lng: 4.35 },
    ...partial,
  };
}

describe("technicianCompletionReport", () => {
  it("allows amend for done assigned mission without invoice", () => {
    expect(canTechnicianAmendCompletionReport(iv(), "tech-1")).toEqual({ allowed: true });
  });

  it("blocks amend when invoiced", () => {
    expect(canTechnicianAmendCompletionReport(iv({ status: "invoiced" }), "tech-1").allowed).toBe(
      false,
    );
  });

  it("maps completion photos for wizard preload", () => {
    expect(
      finishWizardPhotosFromIntervention({
        completionPhotos: [{ url: "https://cdn/x.jpg", category: "panne" }],
      }),
    ).toEqual([{ url: "https://cdn/x.jpg", category: "panne" }]);
  });

  it("maps billing lines for wizard preload", () => {
    expect(
      finishWizardBillingLinesFromIntervention({
        billingLines: [{ description: "Main d'oeuvre", quantity: 1, unitPriceCents: 5000 }],
      }),
    ).toEqual([{ description: "Main d'oeuvre", quantity: 1, unitPriceCents: 5000, reference: "" }]);
  });
});
