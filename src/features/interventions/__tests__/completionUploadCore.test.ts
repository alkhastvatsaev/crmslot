/**
 * @jest-environment node
 */

import { getDoc } from "firebase/firestore";
import { performCompletionUpload } from "@/features/interventions/completionUploadCore";
import { transitionInterventionFromTechnician } from "@/features/interventions/workflow/transitionInterventionFromTechnician";

jest.mock("@/core/config/firebase", () => ({
  auth: { currentUser: { uid: "tech-1" } },
  firestore: {},
  storage: {},
}));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
}));

jest.mock("firebase/storage", () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
}));

jest.mock("@/features/interventions/workflow/transitionInterventionFromTechnician", () => ({
  transitionInterventionFromTechnician: jest.fn(() => Promise.resolve()),
}));

jest.mock("@/core/api/fetchWithAuth", () => ({
  fetchWithAuth: jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: async () => ({ ok: true }),
    })
  ),
}));

jest.mock("@/features/interventions/finishJobCapture", () => ({
  dataUrlToBlob: jest.fn(() => new Blob()),
}));

const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;
const mockTransition = transitionInterventionFromTechnician as jest.MockedFunction<
  typeof transitionInterventionFromTechnician
>;

const params = {
  interventionId: "iv-1",
  photoDataUrls: ["https://cdn.example/photo.jpg"],
  signaturePngDataUrl: "data:image/png;base64,sig",
};

describe("performCompletionUpload", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("skips status transition when intervention is already invoiced", async () => {
    mockGetDoc.mockResolvedValue({
      data: () => ({ status: "invoiced", assignedTechnicianUid: "tech-1" }),
    } as Awaited<ReturnType<typeof getDoc>>);

    await expect(performCompletionUpload(params)).resolves.toBeUndefined();

    expect(mockTransition).not.toHaveBeenCalled();
  });
});
