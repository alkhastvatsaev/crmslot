import { makeIntervention } from "@/test-utils/factories";
import {
  buildUnclosedDossierPushMessage,
  pickPrimaryUnclosedIntervention,
  shouldSendUnclosedDossierReminder,
  toUnclosedDossierReminderCandidates,
  UNCLOSED_DOSSIER_REMINDER_MIN_INTERVAL_MS,
} from "@/features/interventions/technicianUnclosedDossierReminders";

describe("technicianUnclosedDossierReminders", () => {
  const uid = "tech-1";

  it("groups open missions per technician", () => {
    const rows = [
      makeIntervention({ id: "a", status: "in_progress", assignedTechnicianUid: uid }),
      makeIntervention({ id: "b", status: "assigned", assignedTechnicianUid: uid }),
      makeIntervention({ id: "c", status: "done", assignedTechnicianUid: uid }),
    ];
    const candidates = toUnclosedDossierReminderCandidates(rows);
    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.technicianUid).toBe(uid);
    expect(candidates[0]?.unclosed.map((iv) => iv.id)).toEqual(["a", "b"]);
  });

  it("picks oldest mission as primary", () => {
    const rows = [
      makeIntervention({
        id: "new",
        status: "assigned",
        assignedTechnicianUid: uid,
        statusUpdatedAt: "2026-06-24T11:00:00.000Z",
      }),
      makeIntervention({
        id: "old",
        status: "in_progress",
        assignedTechnicianUid: uid,
        statusUpdatedAt: "2026-06-24T08:00:00.000Z",
      }),
    ];
    expect(pickPrimaryUnclosedIntervention(rows).id).toBe("old");
  });

  it("throttles repeat push within interval", () => {
    const now = new Date("2026-06-24T12:00:00.000Z");
    const recent = new Date(
      now.getTime() - UNCLOSED_DOSSIER_REMINDER_MIN_INTERVAL_MS + 60_000
    ).toISOString();
    expect(shouldSendUnclosedDossierReminder(recent, now)).toBe(false);
    expect(shouldSendUnclosedDossierReminder(null, now)).toBe(true);
  });

  it("builds single and plural push copy", () => {
    const one = makeIntervention({
      id: "one",
      status: "in_progress",
      assignedTechnicianUid: uid,
      clientFirstName: "Jean",
      clientLastName: "Dupont",
    });
    expect(buildUnclosedDossierPushMessage([one], one).title).toBe("Mission à clôturer");

    const two = [
      one,
      makeIntervention({ id: "two", status: "assigned", assignedTechnicianUid: uid }),
    ];
    expect(buildUnclosedDossierPushMessage(two, one).title).toBe("2 missions à clôturer");
  });
});
