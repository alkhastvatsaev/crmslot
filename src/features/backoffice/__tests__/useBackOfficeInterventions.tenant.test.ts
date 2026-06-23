import { renderHook, waitFor } from "@testing-library/react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import type { Intervention } from "@/features/interventions";
import { useBackOfficeInterventions } from "@/features/backoffice/useBackOfficeInterventions";

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(() => "interventions-col"),
  query: jest.fn((...parts: unknown[]) => ({ parts })),
  where: jest.fn((field: string, op: string, value: string) => ({ field, op, value })),
  onSnapshot: jest.fn(),
}));

jest.mock("@/core/config/firebase", () => ({
  firestore: {},
  auth: { currentUser: { uid: "user-a" } },
  isConfigured: true,
}));

jest.mock("@/core/config/syntheticInterventions", () => ({
  ...jest.requireActual("@/core/config/syntheticInterventions"),
  stripKnownSyntheticInterventions: (rows: Intervention[]) => rows,
}));

const mockOnSnapshot = onSnapshot as jest.MockedFunction<typeof onSnapshot>;
const mockWhere = where as jest.MockedFunction<typeof where>;

function row(id: string, companyId: string): Intervention {
  return {
    id,
    companyId,
    title: id,
    address: "Bruxelles",
    time: "10:00",
    status: "pending",
    location: { lat: 50.85, lng: 4.35 },
  };
}

describe("useBackOfficeInterventions tenant scope", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOnSnapshot.mockImplementation(((_q, onNext) => {
      (onNext as (snap: { docs: { id: string; data: () => object }[] }) => void)({
        docs: [
          { id: "keep", data: () => row("keep", "co-a") },
          { id: "drop", data: () => row("drop", "co-b") },
        ],
      });
      return jest.fn();
    }) as typeof onSnapshot);
  });

  it("queries Firestore with companyId filter", async () => {
    renderHook(() => useBackOfficeInterventions("co-a"));

    await waitFor(() => {
      expect(mockWhere).toHaveBeenCalledWith("companyId", "==", "co-a");
      expect(collection).toHaveBeenCalled();
      expect(query).toHaveBeenCalled();
    });
  });

  it("drops cross-tenant rows from the snapshot", async () => {
    const { result } = renderHook(() => useBackOfficeInterventions("co-a"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.interventions.map((r) => r.id)).toEqual(["keep"]);
  });

  it("runs one Firestore listener per company id (rules-safe, no `in` query)", async () => {
    let call = 0;
    mockOnSnapshot.mockImplementation(((_q, onNext) => {
      const companyId = call === 0 ? "co-a" : "co-b";
      call += 1;
      (onNext as (snap: { docs: { id: string; data: () => object }[] }) => void)({
        docs: [{ id: companyId, data: () => row(companyId, companyId) }],
      });
      return jest.fn();
    }) as typeof onSnapshot);

    const { result } = renderHook(() => useBackOfficeInterventions(["co-a", "co-b"]));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockWhere).toHaveBeenCalledWith("companyId", "==", "co-a");
    expect(mockWhere).toHaveBeenCalledWith("companyId", "==", "co-b");
    expect(mockOnSnapshot).toHaveBeenCalledTimes(2);
    expect(result.current.interventions.map((r) => r.id).sort()).toEqual(["co-a", "co-b"]);
  });
});
