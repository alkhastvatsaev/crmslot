import {
  isPollableDiskAudioName,
  isRecoverablePlaybackError,
  mimeFromAudioUrl,
  queueFindIndexByBasename,
  uploadAudioBasenameFromUrl,
} from "@/features/dispatch/audioUtils";

describe("audioUtils", () => {
  it("uploadAudioBasenameFromUrl extracts filename", () => {
    expect(uploadAudioBasenameFromUrl("https://x.test/path/Clip.M4A?q=1")).toBe("clip.m4a");
  });

  it("queueFindIndexByBasename matches basename", () => {
    const q = [{ url: "https://a/b/foo.m4a", createdAt: "", source: "disk" as const }];
    expect(queueFindIndexByBasename(q, "https://c/d/foo.m4a")).toBe(0);
    expect(queueFindIndexByBasename(q, "https://c/d/bar.mp3")).toBe(-1);
  });

  it("isPollableDiskAudioName accepts common extensions", () => {
    expect(isPollableDiskAudioName("note.M4A")).toBe(true);
    expect(isPollableDiskAudioName("readme.txt")).toBe(false);
  });

  it("mimeFromAudioUrl maps extensions", () => {
    expect(mimeFromAudioUrl("/a/file.mp3")).toBe("audio/mpeg");
    expect(mimeFromAudioUrl("/a/file.m4a")).toBe("audio/mp4");
  });

  it("isRecoverablePlaybackError detects NotAllowedError", () => {
    expect(isRecoverablePlaybackError(new DOMException("", "NotAllowedError"))).toBe(true);
    expect(isRecoverablePlaybackError(new Error("fail"))).toBe(false);
  });
});
