import { completionPhotoUrlsFromIntervention } from "@/features/interventions/completionPhotoUrls";

describe("completionPhotoUrlsFromIntervention", () => {
  it("prefers completionPhotos over legacy urls", () => {
    expect(
      completionPhotoUrlsFromIntervention({
        completionPhotos: [{ url: "https://a/1.jpg", category: "preuve" }],
        completionPhotoUrls: ["https://legacy/x.jpg"],
      }),
    ).toEqual(["https://a/1.jpg"]);
  });

  it("falls back to completionPhotoUrls", () => {
    expect(
      completionPhotoUrlsFromIntervention({
        completionPhotoUrls: ["https://legacy/x.jpg", ""],
      }),
    ).toEqual(["https://legacy/x.jpg"]);
  });

  it("returns empty when no photos", () => {
    expect(completionPhotoUrlsFromIntervention({})).toEqual([]);
  });
});
