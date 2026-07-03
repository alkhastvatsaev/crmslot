import { pickRecommendedSlot } from "@/features/scheduling/pickRecommendedSlot";

describe("pickRecommendedSlot", () => {
  const slots = [
    { date: "2026-05-20", time: "09:00" },
    { date: "2026-05-20", time: "11:00" },
  ];

  it("prefers requested time when available", () => {
    expect(pickRecommendedSlot(slots, "11:00")).toBe("11:00");
  });

  it("falls back to the closest available slot", () => {
    expect(pickRecommendedSlot(slots, "15:00")).toBe("11:00");
  });

  it("returns null when no slots", () => {
    expect(pickRecommendedSlot([], "09:00")).toBeNull();
  });
});
