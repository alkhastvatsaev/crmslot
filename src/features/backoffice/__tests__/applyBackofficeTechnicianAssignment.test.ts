import { applyBackofficeTechnicianAssignmentAdmin } from "@/features/backoffice/applyBackofficeTechnicianAssignmentAdmin";
import { canApplyBackofficeTechnicianAssignment } from "@/features/backoffice/applyBackofficeTechnicianAssignmentShared";
import type { Intervention } from "@/features/interventions";

const mockTransitionAdmin = jest.fn(async () => ({ id: "evt-1" }));
const mockUpdate = jest.fn(async () => undefined);

const mockNotifyAssignment = jest.fn(async () => ({ sent: 1 }));

jest.mock("@/features/interventions/server/notifyTechnicianAssignmentAdmin", () => ({
  notifyTechnicianAssignmentAdmin: (...args: unknown[]) => mockNotifyAssignment(...args),
}));

jest.mock("@/features/interventions/workflow/transitionInterventionStatusAdmin", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transitionInterventionStatusAdmin: (...args: any[]) => (mockTransitionAdmin as any)(...args),
}));

jest.mock("firebase-admin", () => ({
  firestore: {
    FieldValue: {
      delete: () => "__delete__",
      serverTimestamp: () => "__ts__",
    },
  },
}));

function row(partial: Partial<Intervention> = {}): Intervention {
  return {
    id: "iv-assign-1",
    title: "Test",
    address: "Rue 1",
    time: "10:00",
    status: "pending",
    companyId: "co-1",
    location: { lat: 50.8, lng: 4.35 },
    ...partial,
  };
}

function makeMockDb(peerDocs: Intervention[] = []) {
  return {
    collection: () => ({
      where: () => ({
        get: async () => ({
          docs: peerDocs.map((doc) => ({
            id: doc.id,
            data: () => doc,
          })),
        }),
      }),
      doc: () => ({ update: mockUpdate }),
    }),
  } as unknown as Parameters<typeof applyBackofficeTechnicianAssignmentAdmin>[0]["db"];
}

describe("applyBackofficeTechnicianAssignmentAdmin", () => {
  beforeEach(() => {
    mockTransitionAdmin.mockClear();
    mockUpdate.mockClear();
    mockNotifyAssignment.mockClear();
  });

  it("transitions pending to assigned", async () => {
    const iv = row({ status: "pending" });
    const db = makeMockDb();

    await applyBackofficeTechnicianAssignmentAdmin({
      db,
      interventionId: iv.id,
      iv,
      technicianUid: "tech-2",
      actorUid: "ivana-1",
    });

    expect(mockTransitionAdmin).toHaveBeenCalledTimes(1);
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockNotifyAssignment).toHaveBeenCalledTimes(1);
  });

  it("reassigns assigned awaiting accept without status transition", async () => {
    const iv = row({
      status: "assigned",
      assignedTechnicianUid: "tech-1",
      technicianAcceptedAt: undefined,
    });
    const db = makeMockDb();

    await applyBackofficeTechnicianAssignmentAdmin({
      db,
      interventionId: iv.id,
      iv,
      technicianUid: "tech-2",
      actorUid: "ivana-1",
    });

    expect(mockTransitionAdmin).not.toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    const patch = (mockUpdate.mock.calls as unknown[][])[0]![0] as Record<string, unknown>;
    expect(patch.assignedTechnicianUid).toBe("tech-2");
    expect(patch.status).toBe("assigned");
    expect(patch.technicianAcceptedAt).toBe("__delete__");
    expect(mockNotifyAssignment).toHaveBeenCalledTimes(1);
  });

  it("rejects en_route dossiers", () => {
    expect(canApplyBackofficeTechnicianAssignment(row({ status: "en_route" }))).toBe(false);
  });
});
