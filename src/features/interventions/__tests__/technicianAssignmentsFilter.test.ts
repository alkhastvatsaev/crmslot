import type { Intervention } from "@/features/interventions/types";
import {
  buildTechnicianInterventionList,
  filterInterventionsReleasedToTechnician,
} from "@/features/interventions/technicianAssignmentsFilter";

const TECH_UID = "tech-uid-1";

function iv(partial: Partial<Intervention> & Pick<Intervention, "status">): Intervention {
  return {
    id: partial.id ?? "x",
    title: "Test",
    address: "Rue test",
    time: "10:00",
    location: { lat: 50.8, lng: 4.35 },
    ...partial,
  };
}

describe("filterInterventionsReleasedToTechnician", () => {
  const techUid = TECH_UID;

  it("drops pending intake dossiers", () => {
    const rows = [
      iv({ id: "p1", status: "pending" }),
      iv({ id: "a1", status: "assigned", assignedTechnicianUid: techUid }),
    ];
    expect(filterInterventionsReleasedToTechnician(rows, techUid).map((r) => r.id)).toEqual(["a1"]);
  });

  it("keeps only missions assigned to the active technician uid", () => {
    const rows = [
      iv({ id: "mine", status: "assigned", assignedTechnicianUid: techUid }),
      iv({ id: "other", status: "assigned", assignedTechnicianUid: "someone-else" }),
    ];
    expect(filterInterventionsReleasedToTechnician(rows, techUid).map((r) => r.id)).toEqual([
      "mine",
    ]);
  });

  it("returns empty when technician uid is missing", () => {
    expect(
      filterInterventionsReleasedToTechnician(
        [iv({ status: "assigned", assignedTechnicianUid: techUid })],
        null
      )
    ).toEqual([]);
  });
});

describe("buildTechnicianInterventionList", () => {
  const techUid = TECH_UID;

  it("returns only released firestore rows for the technician", () => {
    const firestoreRows = [
      iv({ id: "live-1", status: "assigned", assignedTechnicianUid: techUid }),
      iv({ id: "pending-1", status: "pending" }),
      iv({ id: "mock-day-2026-05-16-0", status: "assigned", assignedTechnicianUid: techUid }),
    ];
    const list = buildTechnicianInterventionList({
      firestoreInterventions: firestoreRows,
      technicianUid: techUid,
    });
    expect(list.map((r) => r.id)).toEqual(["live-1"]);
  });
});
