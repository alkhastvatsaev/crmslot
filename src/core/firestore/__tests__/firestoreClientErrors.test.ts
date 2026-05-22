import { isFirestorePermissionDenied } from "../firestoreClientErrors";

describe("isFirestorePermissionDenied", () => {
  it("detects permission-denied code", () => {
    expect(isFirestorePermissionDenied({ code: "permission-denied" })).toBe(true);
  });

  it("detects English insufficient permissions message", () => {
    expect(
      isFirestorePermissionDenied({ message: "Missing or insufficient permissions." }),
    ).toBe(true);
  });

  it("returns false for other errors", () => {
    expect(isFirestorePermissionDenied({ code: "unavailable" })).toBe(false);
    expect(isFirestorePermissionDenied(null)).toBe(false);
  });
});
