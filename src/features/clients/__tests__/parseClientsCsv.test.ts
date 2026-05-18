import { parseClientsCsv } from "@/features/clients/parseClientsCsv";

describe("parseClientsCsv", () => {
  it("parses header row with semicolons", () => {
    const rows = parseClientsCsv(
      "prenom;nom;telephone;email\nJean;Dupont;+32;jean@test.be",
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.displayName).toBe("Jean Dupont");
    expect(rows[0]?.phone).toBe("+32");
  });

  it("parses positional rows without header", () => {
    const rows = parseClientsCsv("Paul;Martin;0470;;");
    expect(rows[0]?.displayName).toBe("Paul Martin");
  });

  it("skips rows without identifiable name", () => {
    const rows = parseClientsCsv(";;;");
    expect(rows).toHaveLength(0);
  });
});
