import {
  parseCreatedAtMs,
  sortInterventionsByRecency,
} from "@/features/chatbot/chatbot-intervention-source";

describe("chatbot-intervention-source", () => {
  it("sorts by createdAt descending", () => {
    const rows = [
      { id: "a", createdAt: "2026-01-01T00:00:00.000Z" },
      { id: "b", createdAt: "2026-05-01T00:00:00.000Z" },
    ];
    expect(sortInterventionsByRecency(rows).map((r) => r.id)).toEqual(["b", "a"]);
  });

  it("parses Firestore timestamp seconds", () => {
    expect(parseCreatedAtMs({ createdAt: { seconds: 1_700_000_000 } })).toBeGreaterThan(0);
  });
});
