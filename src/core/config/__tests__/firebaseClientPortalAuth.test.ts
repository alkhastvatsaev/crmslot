/** Vérifie que le portail client expose une auth Firebase distincte du CRM. */
import { auth, clientPortalAuth, clientPortalFirestore, firestore } from "@/core/config/firebase";

describe("firebase client portal auth isolation", () => {
  it("exports separate auth instances for CRM and client portal", () => {
    expect(auth).toBeDefined();
    expect(clientPortalAuth).toBeDefined();
    expect(auth).not.toBe(clientPortalAuth);
  });

  it("exports separate Firestore instances for CRM and client portal", () => {
    expect(firestore).toBeDefined();
    expect(clientPortalFirestore).toBeDefined();
    expect(firestore).not.toBe(clientPortalFirestore);
  });
});
