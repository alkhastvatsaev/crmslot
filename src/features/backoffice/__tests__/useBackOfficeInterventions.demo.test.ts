import { renderHook, waitFor } from "@testing-library/react";
import { DEMO_COMPANY_ID } from "@/core/config/devUiPreview";
import { demoInterventionsForCompany } from "@/features/dev/demoInterventions";
import { useBackOfficeInterventions } from "@/features/backoffice/useBackOfficeInterventions";

jest.mock("@/core/config/firebase", () => ({
  firestore: {},
  auth: { currentUser: { uid: "anon-vercel", isAnonymous: true } },
  isConfigured: true,
}));

jest.mock("@/core/config/devUiPreview", () => ({
  ...jest.requireActual("@/core/config/devUiPreview"),
  devUiPreviewEnabled: true,
  realInterventionsOnly: false,
}));

describe("useBackOfficeInterventions demo company on configured Firebase", () => {
  it("serves in-memory demo rows for demo-local-company instead of empty Firestore", async () => {
    const { result } = renderHook(() => useBackOfficeInterventions(DEMO_COMPANY_ID));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.interventions.length).toBeGreaterThan(0);
    expect(result.current.interventions).toEqual(demoInterventionsForCompany(DEMO_COMPANY_ID));
  });
});
