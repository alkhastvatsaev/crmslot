/** @jest-environment node */
import { findBestTechnician } from "@/features/dispatch/algorithm";
import type { Technician } from "@/features/technicians/types";

const mockFetch = jest.fn();

jest.mock("@/core/api/fetchWithAuth", () => ({
  fetchWithAuth: (...args: unknown[]) => mockFetch(...args),
}));

function tech(
  id: string,
  opts: Partial<Technician> = {},
): Technician {
  return {
    id,
    name: `Tech ${id}`,
    initial: id[0]?.toUpperCase() ?? "T",
    vehicle: "Van",
    status: "available",
    location: { lat: 50.85, lng: 4.35 },
    authUid: `uid-${id}`,
    ...opts,
  };
}

function mapsOk(durationSeconds: number): Response {
  return {
    ok: true,
    json: async () => ({ success: true, durationSeconds, durationText: `${durationSeconds}s` }),
  } as unknown as Response;
}

function aiOk(bestTechnicianId: string, reasoning = "AI choice"): Response {
  return {
    ok: true,
    json: async () => ({ bestTechnicianId, reasoning }),
  } as unknown as Response;
}

describe("findBestTechnician", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns null when no technicians provided", async () => {
    const result = await findBestTechnician([], 50.85, 4.35);
    expect(result).toBeNull();
  });

  it("returns null when all technicians are unavailable", async () => {
    const result = await findBestTechnician(
      [tech("a", { status: "on_site" }), tech("b", { status: "en_route" })],
      50.85,
      4.35,
    );
    expect(result).toBeNull();
  });

  it("returns null when technicians have no valid location", async () => {
    const result = await findBestTechnician(
      [tech("a", { location: { lat: NaN, lng: 4.35 } })],
      50.85,
      4.35,
    );
    expect(result).toBeNull();
  });

  it("returns null when technician has no authUid (canResolveTechnicianAssignUid fails)", async () => {
    const result = await findBestTechnician(
      [tech("a", { authUid: undefined })],
      50.85,
      4.35,
    );
    expect(result).toBeNull();
  });

  it("uses AI recommendation when available", async () => {
    mockFetch
      .mockResolvedValueOnce(mapsOk(300)) // tech-a maps distance
      .mockResolvedValueOnce(mapsOk(600)) // tech-b maps distance
      .mockResolvedValueOnce(aiOk("tech-b")); // AI prefers tech-b

    const result = await findBestTechnician(
      [tech("tech-a"), tech("tech-b", { location: { lat: 50.9, lng: 4.4 } })],
      50.85,
      4.35,
    );

    expect(result?.technician.id).toBe("tech-b");
    expect(result?.reasoning).toBe("AI choice");
  });

  it("falls back to shortest maps duration when AI fails", async () => {
    mockFetch
      .mockResolvedValueOnce(mapsOk(200)) // tech-a
      .mockResolvedValueOnce(mapsOk(800)) // tech-b
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) } as unknown as Response); // AI fails

    const result = await findBestTechnician(
      [tech("tech-a"), tech("tech-b", { location: { lat: 50.9, lng: 4.4 } })],
      50.85,
      4.35,
    );

    expect(result?.technician.id).toBe("tech-a");
    expect(result?.reasoning).toBeUndefined();
  });

  it("falls back to haversine when maps API times out", async () => {
    mockFetch
      .mockRejectedValueOnce(new Error("AbortError")) // tech-a maps timeout
      .mockRejectedValueOnce(new Error("AbortError")) // tech-b maps timeout
      .mockRejectedValueOnce(new Error("AbortError")); // AI timeout

    // tech-near is closest by haversine
    const result = await findBestTechnician(
      [
        tech("tech-far", { location: { lat: 51.0, lng: 4.6 } }),
        tech("tech-near", { location: { lat: 50.851, lng: 4.351 } }),
      ],
      50.85,
      4.35,
    );

    expect(result?.technician.id).toBe("tech-near");
  });

  it("respects requiredSkills filter — excludes technician without matching skills", async () => {
    mockFetch
      .mockResolvedValueOnce(mapsOk(300)) // only skilled tech
      .mockResolvedValueOnce(aiOk("skilled"));

    const result = await findBestTechnician(
      [
        tech("unskilled", { skills: ["serrurerie"] }),
        tech("skilled", { skills: ["serrurerie", "alarme"] }),
      ],
      50.85,
      4.35,
      null,
      null,
      ["alarme"],
    );

    // unskilled shouldn't be passed to AI; result should be skilled
    expect(result?.technician.id).toBe("skilled");
  });

  it("considers only top 3 technicians for maps+AI calls", async () => {
    // 5 available technicians — only top 3 get maps/AI calls
    const technicians = Array.from({ length: 5 }, (_, i) =>
      tech(`t${i}`, { location: { lat: 50.85 + i * 0.01, lng: 4.35 + i * 0.01 } }),
    );

    mockFetch.mockResolvedValue(mapsOk(100));

    await findBestTechnician(technicians, 50.85, 4.35);

    // 3 maps calls + 1 AI call = 4 total
    expect(mockFetch).toHaveBeenCalledTimes(4);
  });
});
