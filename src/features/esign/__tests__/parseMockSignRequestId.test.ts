import { parseMockSignRequestId } from "../parseMockSignRequestId";

describe("parseMockSignRequestId", () => {
  it("extrait l'interventionId", () => {
    expect(parseMockSignRequestId("mock-sign-iv-abc-1718034567890")).toBe("iv-abc");
  });

  it("rejette un format invalide", () => {
    expect(parseMockSignRequestId("other-id")).toBeNull();
  });
});
