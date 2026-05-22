/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from "@testing-library/react";
import { useCompanyCrmActivityLog } from "../useCompanyCrmActivityLog";
import { DEMO_COMPANY_ID } from "@/core/config/devUiPreview";

const mockOnSnapshot = jest.fn();
const mockQuery = jest.fn();
const mockCollection = jest.fn();

jest.mock("firebase/firestore", () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  orderBy: jest.fn(),
  limit: jest.fn(),
  onSnapshot: (...args: unknown[]) => mockOnSnapshot(...args),
}));

jest.mock("@/core/config/firebase", () => ({
  firestore: {},
  isConfigured: true,
}));

jest.mock("@/core/config/devUiPreview", () => ({
  DEMO_COMPANY_ID: "demo-local-company",
}));

describe("useCompanyCrmActivityLog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOnSnapshot.mockReturnValue(jest.fn());
  });

  it("subscribes to crm_activity for demo company (journal commandes matériel)", async () => {
    renderHook(() => useCompanyCrmActivityLog(DEMO_COMPANY_ID));

    await waitFor(() => {
      expect(mockOnSnapshot).toHaveBeenCalled();
    });
  });

  it("subscribes for a real company id", async () => {
    renderHook(() => useCompanyCrmActivityLog("acme-corp"));

    await waitFor(() => {
      expect(mockOnSnapshot).toHaveBeenCalled();
    });
  });

  it("does not surface permission-denied as blocking error", async () => {
    mockOnSnapshot.mockImplementation((_q, _ok, onErr) => {
      onErr?.({ code: "permission-denied", message: "Missing or insufficient permissions." });
      return jest.fn();
    });

    const { result } = renderHook(() => useCompanyCrmActivityLog("acme-corp"));

    await waitFor(() => {
      expect(result.current.error).toBeNull();
      expect(result.current.rows).toEqual([]);
    });
  });
});
