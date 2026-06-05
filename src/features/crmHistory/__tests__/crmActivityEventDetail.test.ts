import { buildCrmActivityEventDetail } from "@/features/crmHistory/crmActivityEventDetail";
import type { CrmActivityEvent } from "@/features/crmHistory/crmActivityTypes";

const t = (key: string) => {
  const map: Record<string, string> = {
    "crmHistory.detail.body.intervention_created": "Dossier créé — intro.",
    "crmHistory.detail.label.client": "Client",
    "crmHistory.detail.label.intervention": "Dossier",
    "crmHistory.detail.status_transition": "Évolution : {before} → {after}",
    "crmHistory.actor.technician": "Technicien",
    "crmHistory.detail.label.actor": "Par",
    "status.en_route": "En route",
    "status.in_progress": "En cours",
    "quotes.status.draft": "Brouillon",
    "quotes.status.sent": "Envoyé",
  };
  return map[key] ?? key;
};

describe("buildCrmActivityEventDetail", () => {
  it("includes intro and context fields", () => {
    const event: CrmActivityEvent = {
      id: "e1",
      type: "intervention_created",
      ts: Date.now(),
      interventionTitle: "Serrure",
      clientName: "Dupont",
    };
    const { lines } = buildCrmActivityEventDetail(event, t);
    expect(lines[0]).toContain("Dossier créé");
    expect(lines.some((l) => l.includes("Dupont"))).toBe(true);
    expect(lines.some((l) => l.includes("Serrure"))).toBe(true);
  });

  it("formats status transition", () => {
    const event: CrmActivityEvent = {
      id: "e2",
      type: "intervention_status",
      ts: Date.now(),
      statusBefore: "en_route",
      statusAfter: "in_progress",
    };
    const { lines } = buildCrmActivityEventDetail(event, (key) => {
      if (key === "crmHistory.detail.body.intervention_status") return "Statut changé.";
      if (key === "crmHistory.detail.status_transition") return "{before} → {after}";
      if (key === "status.en_route") return "En route";
      if (key === "status.in_progress") return "En cours";
      return key;
    });
    expect(lines.some((l) => l.includes("En route") && l.includes("En cours"))).toBe(true);
  });
});
