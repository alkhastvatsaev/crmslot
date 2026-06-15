import { saveOrShareDocument, type SaveOrShareDeps } from "@/core/native/nativeDocumentSave";

function makeDeps(overrides: Partial<SaveOrShareDeps> = {}): SaveOrShareDeps {
  const writeFile = jest.fn(async () => ({ uri: "file:///docs/x.pdf" }));
  const share = jest.fn(async () => undefined);
  return {
    isNative: () => false,
    loadFilesystem: async () => ({
      Filesystem: { writeFile },
      Directory: { Documents: "DOCUMENTS" },
    }),
    loadShare: async () => ({ Share: { share } }),
    ...overrides,
  };
}

describe("saveOrShareDocument — pattern injection deps", () => {
  it("Capacitor : Filesystem.writeFile puis Share.share", async () => {
    const writeFile = jest.fn(async () => ({ uri: "file:///docs/x.pdf" }));
    const share = jest.fn(async () => undefined);

    const result = await saveOrShareDocument(
      {
        filename: "x.pdf",
        bytes: new Uint8Array([1, 2, 3]),
        mimeType: "application/pdf",
        shareTitle: "Rapport",
      },
      {
        isNative: () => true,
        loadFilesystem: async () => ({
          Filesystem: { writeFile },
          Directory: { Documents: "DOCUMENTS" },
        }),
        loadShare: async () => ({ Share: { share } }),
      }
    );

    expect(result).toEqual({
      ok: true,
      via: "capacitor",
      path: "file:///docs/x.pdf",
      uri: "file:///docs/x.pdf",
      shared: true,
    });
    expect(writeFile).toHaveBeenCalledWith(
      expect.objectContaining({
        path: "x.pdf",
        directory: "DOCUMENTS",
        recursive: true,
      })
    );
    expect(share).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Rapport", url: "file:///docs/x.pdf" })
    );
  });

  it("Capacitor : share annulé → fichier reste écrit (shared: false)", async () => {
    const writeFile = jest.fn(async () => ({ uri: "file:///docs/y.pdf" }));
    const share = jest.fn(async () => {
      throw new Error("User canceled");
    });

    const result = await saveOrShareDocument(
      { filename: "y.pdf", bytes: new Uint8Array([1]), mimeType: "application/pdf" },
      {
        isNative: () => true,
        loadFilesystem: async () => ({
          Filesystem: { writeFile },
          Directory: { Documents: "D" },
        }),
        loadShare: async () => ({ Share: { share } }),
      }
    );

    expect(result).toEqual(expect.objectContaining({ ok: true, via: "capacitor", shared: false }));
  });

  it("Capacitor : share désactivé via share:false", async () => {
    const writeFile = jest.fn(async () => ({ uri: "file:///docs/z.pdf" }));
    const share = jest.fn();

    const result = await saveOrShareDocument(
      {
        filename: "z.pdf",
        bytes: new Uint8Array([1]),
        mimeType: "application/pdf",
        share: false,
      },
      {
        isNative: () => true,
        loadFilesystem: async () => ({
          Filesystem: { writeFile },
          Directory: { Documents: "D" },
        }),
        loadShare: async () => ({ Share: { share } }),
      }
    );

    expect(result).toEqual(expect.objectContaining({ shared: false }));
    expect(share).not.toHaveBeenCalled();
  });

  it("Capacitor : writeFile échoue → fallback web download", async () => {
    const webDownload = jest.fn(() => ({ ok: true as const, via: "web-download" as const }));

    const result = await saveOrShareDocument(
      { filename: "z.pdf", bytes: new Uint8Array([1]), mimeType: "application/pdf" },
      {
        ...makeDeps({ isNative: () => true }),
        loadFilesystem: async () => {
          throw new Error("plugin unavailable");
        },
        webDownload,
      }
    );

    expect(result).toEqual({ ok: true, via: "web-download" });
    expect(webDownload).toHaveBeenCalledTimes(1);
  });

  it("Web pur : utilise le webDownload injecté", async () => {
    const webDownload = jest.fn(() => ({ ok: true as const, via: "web-download" as const }));

    const result = await saveOrShareDocument(
      { filename: "w.pdf", bytes: new Uint8Array([1]), mimeType: "application/pdf" },
      makeDeps({ isNative: () => false, webDownload })
    );

    expect(result).toEqual({ ok: true, via: "web-download" });
    expect(webDownload).toHaveBeenCalledTimes(1);
  });

  it("Web pur sans webDownload : déclenche un download Blob via DOM (jsdom)", async () => {
    const clickSpy = jest.fn();
    const origCreate = document.createElement.bind(document);
    const createSpy = jest.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "a") {
        const a = origCreate(tag) as HTMLAnchorElement;
        a.click = clickSpy;
        return a;
      }
      return origCreate(tag);
    });

    const result = await saveOrShareDocument(
      { filename: "default-web.pdf", bytes: new Uint8Array([1, 2]), mimeType: "application/pdf" },
      makeDeps({ isNative: () => false })
    );

    expect(result).toEqual({ ok: true, via: "web-download" });
    expect(clickSpy).toHaveBeenCalledTimes(1);
    createSpy.mockRestore();
  });
});
