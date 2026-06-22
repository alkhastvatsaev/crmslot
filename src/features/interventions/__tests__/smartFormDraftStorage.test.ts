import {
  emptyDraft,
  initialStepFromPayload,
  loadStorageDraft,
} from "@/features/interventions/smartFormDraftStorage";

describe("smartFormDraftStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("emptyDraft returns blank payload", () => {
    const d = emptyDraft();
    expect(d.address).toBe("");
    expect(d.photoDataUrls).toEqual([]);
  });

  it("initialStepFromPayload returns 1 for empty draft", () => {
    expect(initialStepFromPayload(emptyDraft())).toBe(1);
  });

  it("loadStorageDraft returns null when missing", () => {
    expect(loadStorageDraft()).toBeNull();
  });
});
