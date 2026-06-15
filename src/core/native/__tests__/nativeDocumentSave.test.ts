import { saveOrShareDocument } from "@/core/native/nativeDocumentSave";

jest.mock("@/core/native/capacitorRuntime", () => ({
  isCapacitorNative: jest.fn(),
}));

import { isCapacitorNative } from "@/core/native/capacitorRuntime";

describe("saveOrShareDocument", () => {
  beforeEach(() => {
    (isCapacitorNative as jest.Mock).mockReset();
  });

  it("retourne 'web-download' quand pas en Capacitor", async () => {
    (isCapacitorNative as jest.Mock).mockReturnValue(false);

    const clickSpy = jest.fn();
    const origCreate = document.createElement.bind(document);
    jest.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "a") {
        const a = origCreate(tag) as HTMLAnchorElement;
        a.click = clickSpy;
        return a;
      }
      return origCreate(tag);
    });
    const revokeSpy = jest.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    jest.spyOn(URL, "createObjectURL").mockReturnValue("blob:fake");

    const result = await saveOrShareDocument({
      filename: "doc.pdf",
      bytes: new Uint8Array([1, 2, 3]),
      mimeType: "application/pdf",
    });

    expect(result).toEqual({ ok: true, via: "web-download" });
    expect(clickSpy).toHaveBeenCalledTimes(1);

    // cleanup
    revokeSpy.mockRestore();
    (document.createElement as jest.Mock).mockRestore?.();
  });
});
