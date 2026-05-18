import {
  clientSearchHaystack,
  interventionSearchHaystack,
  matchesWorkspaceQuery,
} from "@/features/chatbot/chatbot-workspace-search";

describe("chatbot-workspace-search", () => {
  it("matches substring case-insensitively", () => {
    expect(matchesWorkspaceQuery("Alkhast Vatsaev", "vatsaev")).toBe(true);
  });

  it("indexes client first and last name", () => {
    const hay = clientSearchHaystack({
      displayName: "",
      firstName: "Alkhast",
      lastName: "Vatsaev",
    });
    expect(hay.toLowerCase()).toContain("vatsaev");
  });

  it("indexes intervention client fields", () => {
    const hay = interventionSearchHaystack({
      clientLastName: "Vatsaev",
      clientFirstName: "Alkhast",
    });
    expect(hay.toLowerCase()).toContain("vatsaev");
  });
});
