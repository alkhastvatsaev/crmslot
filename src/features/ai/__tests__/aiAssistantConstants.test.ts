import { AI_ASSISTANT_SLOT_INDEX } from "@/features/ai/aiAssistantConstants";

describe("ai feature surface", () => {
  it("legacy AI_ASSISTANT_SLOT_INDEX is the deprecation sentinel (-1)", () => {
    expect(AI_ASSISTANT_SLOT_INDEX).toBe(-1);
  });
});
