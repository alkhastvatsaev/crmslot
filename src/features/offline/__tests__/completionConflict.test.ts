import { remoteCompletionIsNewerThanQueued } from "@/features/offline/completionConflict";

describe("remoteCompletionIsNewerThanQueued", () => {
  it("returns false when remote is not completed", () => {
    expect(remoteCompletionIsNewerThanQueued("in_progress", { toMillis: () => 9_999 }, 1_000)).toBe(false);
  });

  it("returns true when remote completion is newer than queue", () => {
    expect(
      remoteCompletionIsNewerThanQueued("done", { toMillis: () => 5_000 }, 1_000),
    ).toBe(true);
  });

  it("returns false when queue is newer", () => {
    expect(
      remoteCompletionIsNewerThanQueued("done", { toMillis: () => 500 }, 5_000),
    ).toBe(false);
  });
});
