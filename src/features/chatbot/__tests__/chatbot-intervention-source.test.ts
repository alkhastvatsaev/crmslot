jest.mock("@/core/config/devUiPreview", () => {
  const actual = jest.requireActual<typeof import("@/core/config/devUiPreview")>(
    "@/core/config/devUiPreview",
  );
  return {
    ...actual,
    devUiPreviewEnabled: true,
    realInterventionsOnly: false,
  };
});

import {
  mergeDemoInterventionsForChatbot,
  parseCreatedAtMs,
  sortInterventionsByRecency,
} from "@/features/chatbot/chatbot-intervention-source";
import { DEMO_COMPANY_ID } from "@/core/config/devUiPreview";

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

  it("merges demo rows for demo company when dev preview is on", () => {
    const merged = mergeDemoInterventionsForChatbot(DEMO_COMPANY_ID, []);
    expect(merged.some((r) => r.id === "demo-mission-backoffice-only")).toBe(true);
  });
});
