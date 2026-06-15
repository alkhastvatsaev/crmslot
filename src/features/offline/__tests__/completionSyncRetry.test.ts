/**
 * Tests d'intégration pour le retry exponentiel (Phase 2 offline-first).
 * Vérifie que flushCompletionQueue :
 *  - skip les items en cooldown (report.deferred)
 *  - persiste attemptCount + nextAttemptAtMs après échec
 *  - n'efface pas l'item de la queue après échec
 */
import { flushCompletionQueue } from "@/features/offline/completionSync";
import {
  completionQueueGetAll,
  completionQueuePut,
  completionQueueDelete,
} from "@/features/offline/completionQueueDb";
import { performCompletionUpload } from "@/features/interventions/completionUploadCore";
import { getDoc } from "firebase/firestore";

jest.mock("@/features/offline/completionQueueDb", () => ({
  completionQueuePut: jest.fn(),
  completionQueueGetAll: jest.fn(),
  completionQueueDelete: jest.fn(),
  completionQueueCount: jest.fn().mockResolvedValue(0),
}));

jest.mock("@/features/interventions/completionUploadCore", () => ({
  performCompletionUpload: jest.fn(),
}));

jest.mock("@/core/config/firebase", () => ({
  firestore: {},
}));

const mockGetAll = completionQueueGetAll as jest.MockedFunction<typeof completionQueueGetAll>;
const mockPut = completionQueuePut as jest.MockedFunction<typeof completionQueuePut>;
const mockDelete = completionQueueDelete as jest.MockedFunction<typeof completionQueueDelete>;
const mockUpload = performCompletionUpload as jest.MockedFunction<typeof performCompletionUpload>;
const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;

function fakeRemoteNotDone() {
  return Promise.resolve({
    exists: () => true,
    data: () => ({ status: "assigned" }),
    id: "iv-1",
  } as unknown as ReturnType<typeof getDoc> extends Promise<infer R> ? R : never);
}

describe("flushCompletionQueue — retry exponentiel (Phase 2)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
  });

  it("skip un item encore en cooldown et le compte dans report.deferred", async () => {
    const future = Date.now() + 60_000;
    mockGetAll.mockResolvedValueOnce([
      {
        localId: "L1",
        interventionId: "iv-1",
        photoDataUrls: ["x"],
        signaturePngDataUrl: "y",
        queuedAtMs: Date.now() - 10_000,
        attemptCount: 1,
        nextAttemptAtMs: future,
      },
    ]);

    const report = await flushCompletionQueue();

    expect(report.deferred).toBe(1);
    expect(report.uploaded).toBe(0);
    expect(report.failed).toBe(0);
    expect(mockUpload).not.toHaveBeenCalled();
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("persiste attemptCount + nextAttemptAtMs après échec de l'upload", async () => {
    mockGetAll.mockResolvedValueOnce([
      {
        localId: "L1",
        interventionId: "iv-1",
        photoDataUrls: ["x"],
        signaturePngDataUrl: "y",
        queuedAtMs: Date.now() - 10_000,
        // jamais essayé → éligible
      },
    ]);
    mockGetDoc.mockImplementation(fakeRemoteNotDone as never);
    mockUpload.mockRejectedValueOnce(new Error("network"));

    const report = await flushCompletionQueue();

    expect(report.failed).toBe(1);
    expect(report.deferred).toBe(0);
    expect(mockPut).toHaveBeenCalledTimes(1);
    const persisted = mockPut.mock.calls[0]?.[0];
    expect(persisted?.attemptCount).toBe(1);
    expect(persisted?.nextAttemptAtMs).toBeGreaterThan(Date.now());
    // L'item NE doit pas être supprimé
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("incrémente attemptCount à chaque échec successif", async () => {
    mockGetAll.mockResolvedValueOnce([
      {
        localId: "L1",
        interventionId: "iv-1",
        photoDataUrls: ["x"],
        signaturePngDataUrl: "y",
        queuedAtMs: Date.now() - 10_000,
        attemptCount: 2, // déjà 2 échecs
        nextAttemptAtMs: Date.now() - 1, // expiré → éligible
      },
    ]);
    mockGetDoc.mockImplementation(fakeRemoteNotDone as never);
    mockUpload.mockRejectedValueOnce(new Error("still network"));

    const report = await flushCompletionQueue();
    expect(report.failed).toBe(1);
    const persisted = mockPut.mock.calls[0]?.[0];
    expect(persisted?.attemptCount).toBe(3);
  });

  it("supprime l'item de la queue après upload réussi (efface attemptCount au passage)", async () => {
    mockGetAll.mockResolvedValueOnce([
      {
        localId: "L1",
        interventionId: "iv-1",
        photoDataUrls: ["x"],
        signaturePngDataUrl: "y",
        queuedAtMs: Date.now() - 10_000,
        attemptCount: 3,
        nextAttemptAtMs: Date.now() - 1,
      },
    ]);
    mockGetDoc.mockImplementation(fakeRemoteNotDone as never);
    mockUpload.mockResolvedValueOnce(undefined as never);

    const report = await flushCompletionQueue();
    expect(report.uploaded).toBe(1);
    expect(report.failed).toBe(0);
    expect(mockDelete).toHaveBeenCalledWith("L1");
    // pas de re-persistance car succès
    expect(mockPut).not.toHaveBeenCalled();
  });
});
