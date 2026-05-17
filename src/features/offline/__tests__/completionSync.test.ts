import {
  enqueueCompletionRecord,
  finalizeCompletionOfflineAware,
  flushCompletionQueue,
  getCompletionQueueLength,
} from "@/features/offline/completionSync";
import { completionQueueGetAll, completionQueuePut, completionQueueDelete } from "@/features/offline/completionQueueDb";
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

const mockPut = completionQueuePut as jest.MockedFunction<typeof completionQueuePut>;
const mockGetAll = completionQueueGetAll as jest.MockedFunction<typeof completionQueueGetAll>;
const mockDelete = completionQueueDelete as jest.MockedFunction<typeof completionQueueDelete>;
const mockUpload = performCompletionUpload as jest.MockedFunction<typeof performCompletionUpload>;
const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;

describe("finalizeCompletionOfflineAware", () => {
  beforeEach(() => {
    mockPut.mockClear();
    mockUpload.mockClear();
  });

  it("queues payload when navigator is offline", async () => {
    const online = Object.getOwnPropertyDescriptor(navigator, "onLine");
    Object.defineProperty(navigator, "onLine", { configurable: true, value: false });

    const result = await finalizeCompletionOfflineAware({
      interventionId: "iv-1",
      photoDataUrls: ["data:image/png;base64,abc"],
      signaturePngDataUrl: "data:image/png;base64,sig",
    });

    expect(result).toEqual({ outcome: "queued" });
    expect(mockPut).toHaveBeenCalledTimes(1);
    expect(mockUpload).not.toHaveBeenCalled();

    if (online) Object.defineProperty(navigator, "onLine", online);
    else Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
  });

  it("uploads directly when online and upload succeeds", async () => {
    Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
    mockUpload.mockResolvedValue(undefined);

    const result = await finalizeCompletionOfflineAware({
      interventionId: "iv-2",
      photoDataUrls: [],
      signaturePngDataUrl: "data:image/png;base64,sig",
    });

    expect(result).toEqual({ outcome: "sent" });
    expect(mockUpload).toHaveBeenCalledWith({
      interventionId: "iv-2",
      photoDataUrls: [],
      signaturePngDataUrl: "data:image/png;base64,sig",
    });
  });
});

describe("flushCompletionQueue", () => {
  beforeEach(() => {
    mockGetAll.mockReset();
    mockDelete.mockReset();
    mockUpload.mockReset();
    mockGetDoc.mockReset();
    Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
  });

  it("skips queue item when remote completion is newer", async () => {
    mockGetAll.mockResolvedValue([
      {
        localId: "local-1",
        interventionId: "iv-conflict",
        photoDataUrls: [],
        signaturePngDataUrl: "sig",
        queuedAtMs: 1_000,
      },
    ]);

    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        status: "done",
        completedAt: { toMillis: () => 9_000 },
      }),
    } as never);

    const report = await flushCompletionQueue();

    expect(report.skippedConflict).toBe(1);
    expect(report.uploaded).toBe(0);
    expect(mockUpload).not.toHaveBeenCalled();
    expect(mockDelete).toHaveBeenCalledWith("local-1");
  });

  it("uploads when remote is not completed", async () => {
    mockGetAll.mockResolvedValue([
      {
        localId: "local-2",
        interventionId: "iv-ok",
        photoDataUrls: ["p"],
        signaturePngDataUrl: "sig",
        queuedAtMs: 5_000,
      },
    ]);

    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ status: "in_progress" }),
    } as never);
    mockUpload.mockResolvedValue(undefined);

    const report = await flushCompletionQueue();

    expect(report.uploaded).toBe(1);
    expect(mockUpload).toHaveBeenCalled();
  });
});

describe("getCompletionQueueLength", () => {
  it("returns 0 when count fails", async () => {
    const { completionQueueCount } = jest.requireMock("@/features/offline/completionQueueDb");
    completionQueueCount.mockRejectedValueOnce(new Error("idb"));
    await expect(getCompletionQueueLength()).resolves.toBe(0);
  });
});
