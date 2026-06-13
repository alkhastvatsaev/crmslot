/** @jest-environment node */

import { rejectInterventionReportServer } from "@/features/interventions/server/rejectInterventionReportServer";
import type { Intervention } from "@/features/interventions/types";

const mockAssertDispatch = jest.fn();
const mockTransition = jest.fn();
const mockSendEmail = jest.fn();
const mockGetUser = jest.fn();

jest.mock("@/features/backoffice/assignInterventionServerAuth", () => ({
  assertCanAssignInterventionServer: (...args: unknown[]) => mockAssertDispatch(...args),
}));

jest.mock("@/features/interventions/workflow/transitionInterventionStatusAdmin", () => ({
  transitionInterventionStatusAdmin: (...args: unknown[]) => mockTransition(...args),
}));

jest.mock("@/core/services/email/sendInterventionEmail", () => ({
  sendInterventionEmail: (...args: unknown[]) => mockSendEmail(...args),
}));

jest.mock("firebase-admin", () => ({
  auth: () => ({ getUser: (...args: unknown[]) => mockGetUser(...args) }),
  firestore: jest.fn(),
}));

function iv(partial: Partial<Intervention> = {}): Intervention {
  return {
    id: "iv-reject-1",
    title: "Porte",
    address: "Rue 1",
    time: "10:00",
    status: "done",
    location: { lat: 50.8, lng: 4.35 },
    companyId: "co-1",
    assignedTechnicianUid: "tech-1",
    ...partial,
  };
}

function makeDb(initial: Intervention) {
  return {
    collection: () => ({
      doc: () => ({
        get: async () => ({ exists: true, id: initial.id, data: () => initial }),
      }),
    }),
  };
}

describe("rejectInterventionReportServer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAssertDispatch.mockResolvedValue(true);
    mockTransition.mockResolvedValue({ id: "evt-1" });
    mockGetUser.mockResolvedValue({ email: "tech@example.com" });
    mockSendEmail.mockResolvedValue({ ok: true, messageId: "msg-1" });
  });

  it("transitions done → in_progress with rejection reason on dossier", async () => {
    const db = makeDb(iv());
    await rejectInterventionReportServer({
      db: db as never,
      interventionId: "iv-reject-1",
      actorUid: "dispatch-1",
      decoded: { uid: "dispatch-1" } as never,
      reason: "Photos manquantes",
    });

    expect(mockTransition).toHaveBeenCalledWith(
      expect.objectContaining({
        interventionId: "iv-reject-1",
        toStatus: "in_progress",
        writeInboxAlerts: true,
        extraPatch: expect.objectContaining({
          reportRejectionReason: "Photos manquantes",
          reportRejectedAt: expect.any(String),
        }),
      })
    );
  });

  it("builds fallback note when reason is omitted", async () => {
    const db = makeDb(iv());
    await rejectInterventionReportServer({
      db: db as never,
      interventionId: "iv-reject-1",
      actorUid: "dispatch-1",
      decoded: { uid: "dispatch-1" } as never,
    });

    expect(mockTransition).toHaveBeenCalledWith(
      expect.objectContaining({
        extraPatch: expect.objectContaining({
          reportRejectionReason: expect.stringContaining("complément demandé"),
        }),
      })
    );
  });

  it("sends notification email to technician", async () => {
    const db = makeDb(iv());
    await rejectInterventionReportServer({
      db: db as never,
      interventionId: "iv-reject-1",
      actorUid: "dispatch-1",
      decoded: { uid: "dispatch-1" } as never,
      reason: "Signature illisible",
    });

    expect(mockGetUser).toHaveBeenCalledWith("tech-1");
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "tech@example.com",
        interventionId: "iv-reject-1",
        companyId: "co-1",
        attachDocumentType: "none",
        sentVia: "reject-report",
      })
    );
    expect(mockSendEmail.mock.calls[0][0].subject).toContain("Porte");
  });

  it("skips email when technician has no email in Firebase Auth", async () => {
    mockGetUser.mockResolvedValue({ email: "" });
    const db = makeDb(iv());
    await rejectInterventionReportServer({
      db: db as never,
      interventionId: "iv-reject-1",
      actorUid: "dispatch-1",
      decoded: { uid: "dispatch-1" } as never,
      reason: "Test",
    });

    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("skips email when assignedTechnicianUid is missing", async () => {
    const db = makeDb(iv({ assignedTechnicianUid: null }));
    await rejectInterventionReportServer({
      db: db as never,
      interventionId: "iv-reject-1",
      actorUid: "dispatch-1",
      decoded: { uid: "dispatch-1" } as never,
    });

    expect(mockGetUser).not.toHaveBeenCalled();
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("refuses when status is not done", async () => {
    const db = makeDb(iv({ status: "in_progress" }));
    await expect(
      rejectInterventionReportServer({
        db: db as never,
        interventionId: "iv-reject-1",
        actorUid: "dispatch-1",
        decoded: { uid: "dispatch-1" } as never,
      })
    ).rejects.toThrow(/in_progress/);
  });

  it("refuses when dispatcher rights not granted", async () => {
    mockAssertDispatch.mockResolvedValue(false);
    const db = makeDb(iv());
    await expect(
      rejectInterventionReportServer({
        db: db as never,
        interventionId: "iv-reject-1",
        actorUid: "bad-actor",
        decoded: { uid: "bad-actor" } as never,
      })
    ).rejects.toThrow(/Droits insuffisants/);
  });
});
