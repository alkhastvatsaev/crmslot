import type { Intervention } from "@/features/interventions/types";
import { getDefaultAssignedTechnicianUid } from "@/features/interventions/defaultAssignedTechnicianUid";
import {
  buildTechnicianInterventionList,
  filterInterventionsReleasedToTechnician,
} from "@/features/interventions/technicianAssignmentsFilter";

function iv(
  partial: Partial<Intervention> & Pick<Intervention, "status">,
): Intervention {
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
  const techUid = getDefaultAssignedTechnicianUid();

  it("drops pending intake dossiers", () => {
    const rows = [
      iv({ id: "p1", status: "pending" }),
      iv({ id: "a1", status: "assigned", assignedTechnicianUid: techUid }),
    ];
    expect(filterInterventionsReleasedToTechnician(rows, techUid).map((r) => r.id)).toEqual([
      "a1",
    ]);
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
        null,
      ),
    ).toEqual([]);
  });
});

describe("buildTechnicianInterventionList", () => {
  const techUid = getDefaultAssignedTechnicianUid();
  const dashboardDate = new Date("2026-05-16T12:00:00");

  it("merges firestore rows without demo mocks when preview demos disabled", () => {
    const firestoreRows = [
      iv({ id: "live-1", status: "assigned", assignedTechnicianUid: techUid }),
      iv({ id: "pending-1", status: "pending" }),
    ];
    const list = buildTechnicianInterventionList({
      firestoreInterventions: firestoreRows,
      technicianUid: techUid,
      dashboardDate,
      devUiPreviewWithDemos: false,
    });
    expect(list.map((r) => r.id)).toEqual(["live-1"]);
  });
});
