import {
  buildCrawlReport,
  mergeResultsIntoIndex,
  type CrawlResult,
} from "@/features/catalog/lecotImageCrawler";
import {
  getLecotProductImageIndex,
  lookupLecotProductImageIndexEntry,
  lookupLecotProductImageIndexUrl,
  lookupLecotProductImageIndexUrlByLabel,
} from "@/features/catalog/lecotProductImageIndex";

describe("lecotProductImageIndex", () => {
  it("resolves kit sku from merged index", () => {
    expect(lookupLecotProductImageIndexUrl("LEC-CYL-2012")).toMatch(/^https:\/\//);
  });

  it("resolves stock reference via legacy merge", () => {
    expect(lookupLecotProductImageIndexUrl("GACH-ELEC")).toMatch(/^https:\/\//);
  });

  it("returns entry metadata", () => {
    const entry = lookupLecotProductImageIndexEntry("LEC-SER-1014");
    expect(entry?.imageUrl).toMatch(/^https:\/\//);
    expect(entry?.source).toBeTruthy();
  });

  it("does not guess unknown sku", () => {
    expect(lookupLecotProductImageIndexUrl("LEC-INVALID-9999")).toBeNull();
    expect(lookupLecotProductImageIndexUrl("NO-SUCH-SKU")).toBeNull();
  });

  it("resolves by exact catalog label", () => {
    expect(lookupLecotProductImageIndexUrlByLabel("Gâche électrique réversible")).toMatch(
      /^https:\/\//
    );
  });

  it("merged index includes catalog sku keys", () => {
    const index = getLecotProductImageIndex();
    expect(Object.keys(index).length).toBeGreaterThanOrEqual(540);
  });
});

describe("lecotImageCrawler report", () => {
  it("builds crawl report counts", () => {
    const results: CrawlResult[] = [
      {
        sku: "LEC-A",
        entry: {
          imageUrl: "https://lecot.be/media/a.jpg",
          label: "A",
          source: "product_page",
          fetchedAt: "2026-06-06T00:00:00.000Z",
        },
      },
      { sku: "LEC-B", entry: null, error: "no match" },
    ];
    const report = buildCrawlReport(results);
    expect(report.ok).toBe(1);
    expect(report.miss).toBe(1);
    expect(report.bySource.product_page).toBe(1);
  });

  it("merges crawl results into index", () => {
    const merged = mergeResultsIntoIndex({}, resultsWithOne(), [
      { sku: "LEC-X", label: "Label X" },
    ]);
    expect(merged["lec-x"]?.imageUrl).toMatch(/^https:\/\//);
    expect(merged["lec-x"]?.label).toBe("Label X");
  });
});

function resultsWithOne(): CrawlResult[] {
  return [
    {
      sku: "LEC-X",
      entry: {
        imageUrl: "https://lecot.be/media/x.jpg",
        label: "",
        source: "search_label",
        fetchedAt: "2026-06-06T00:00:00.000Z",
      },
    },
  ];
}
