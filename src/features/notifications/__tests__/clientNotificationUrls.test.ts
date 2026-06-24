import {
  clientNotificationCaseUrl,
  parseClientNotificationSearchParams,
} from "@/features/notifications/clientNotificationUrls";

describe("clientNotificationUrls", () => {
  it("parses bmClientCase", () => {
    const params = new URLSearchParams("bmClientCase=iv-client-9");
    expect(parseClientNotificationSearchParams(params)).toEqual({
      kind: "case",
      caseId: "iv-client-9",
    });
  });

  it("builds client case deep link", () => {
    expect(clientNotificationCaseUrl("https://app.example.com", "iv-1")).toBe(
      "https://app.example.com/m/demande?bmClientCase=iv-1"
    );
  });
});
