import { mapWithConcurrency } from "../gmailFetchInboxSummaries";

describe("mapWithConcurrency", () => {
  it("préserve l’ordre des résultats", async () => {
    const out = await mapWithConcurrency([1, 2, 3, 4], 2, async (n) => {
      await new Promise((r) => setTimeout(r, 5 - n));
      return n * 10;
    });
    expect(out).toEqual([10, 20, 30, 40]);
  });

  it("retourne un tableau vide si aucun élément", async () => {
    await expect(mapWithConcurrency([], 4, async () => 1)).resolves.toEqual([]);
  });
});
