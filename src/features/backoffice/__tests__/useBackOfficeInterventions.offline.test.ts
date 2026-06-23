/** @jest-environment jsdom */

import { renderHook, waitFor } from "@testing-library/react";
import type { Intervention } from "@/features/interventions";
import { writeAdminInboxInterventionsCache } from "@/features/offline/adminInboxInterventionsCache";
import { useBackOfficeInterventions } from "@/features/backoffice/useBackOfficeInterventions";

jest.mock("@/core/config/firebase", () => ({
  isConfigured: true,
  firestore: {},
  auth: { currentUser: { uid: "test-uid" } },
}));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  onSnapshot: jest.fn(),
}));

const { onSnapshot } = jest.requireMock("firebase/firestore") as {
  onSnapshot: jest.Mock;
};

describe("useBackOfficeInterventions — offline cache", () => {
  const companyId = "co-offline-1";

  beforeEach(() => {
    localStorage.clear();
    onSnapshot.mockClear();
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      value: false,
    });
  });

  afterEach(() => {
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      value: true,
    });
  });

  it("charge la liste inbox depuis le cache sans Firestore quand hors ligne", async () => {
    const iv = {
      id: "iv-offline-1",
      companyId,
      title: "Mission cache",
      status: "new",
    } as Intervention;
    writeAdminInboxInterventionsCache(companyId, [iv]);

    const { result } = renderHook(() => useBackOfficeInterventions(companyId));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.interventions).toHaveLength(1);
    expect(result.current.interventions[0]?.id).toBe("iv-offline-1");
    expect(result.current.fromCache).toBe(true);
    expect(result.current.error).toBeNull();
    expect(onSnapshot).not.toHaveBeenCalled();
  });
});
