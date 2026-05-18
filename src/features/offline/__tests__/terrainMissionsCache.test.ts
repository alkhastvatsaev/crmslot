import {
  readTerrainMissionsCache,
  writeTerrainMissionsCache,
} from "@/features/offline/terrainMissionsCache";
import type { Intervention } from "@/features/interventions/types";

describe("terrainMissionsCache", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("round-trips mission rows", () => {
    const iv = {
      id: "iv-1",
      title: "Test",
      problem: "Porte",
      address: "Rue 1",
      status: "assigned",
    } as Intervention;
    writeTerrainMissionsCache("tech-1", [iv]);
    const rows = readTerrainMissionsCache("tech-1");
    expect(rows).toHaveLength(1);
    expect(rows[0]?.id).toBe("iv-1");
    expect(rows[0]?.title).toBe("Test");
  });
});
