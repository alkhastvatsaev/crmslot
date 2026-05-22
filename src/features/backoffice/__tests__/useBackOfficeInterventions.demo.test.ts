import { renderHook, waitFor } from "@testing-library/react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import type { Intervention } from "@/features/interventions/types";
import { DEMO_COMPANY_ID } from "@/core/config/devUiPreview";
import { demoInterventionsForCompany } from "@/features/dev/demoInterventions";
import { useBackOfficeInterventions } from "@/features/backoffice/useBackOfficeInterventions";

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(() => "interventions-col"),
  query: jest.fn((...parts: unknown[]) => ({ parts })),
  where: jest.fn((field: string, op: string, value: string) => ({ field, op, value })),
  onSnapshot: jest.fn(),
}));

jest.mock("@/core/config/firebase", () => ({
  firestore: {},
  auth: { currentUser: { uid: "anon-vercel", isAnonymous: true } },
  isConfigured: true,
}));

jest.mock("@/core/config/devUiPreview", () => ({
  ...jest.requireActual("@/core/config/devUiPreview"),
  devUiPreviewEnabled: true,
  stripKnownSyntheticInterventions: (rows: Intervention[]) => rows,
}));

const mockOnSnapshot = onSnapshot as jest.MockedFunction<typeof onSnapshot>;
const mockWhere = where as jest.MockedFunction<typeof where>;

function row(id: string): Intervention {
  return {
    id,
    companyId: DEMO_COMPANY_ID,
    title: id,
    address: "Bruxelles",
    time: "10:00",
    status: "pending",
    location: { lat: 50.85, lng: 4.35 },
    createdAt: "2026-05-20T10:00:00.000Z",
  };
}

describe("useBackOfficeInterventions demo company on configured Firebase", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("uses live Firestore rows for demo-local-company when present", async () => {
    mockOnSnapshot.mockImplementation(((_q, onNext) => {
      (onNext as (snap: { docs: { id: string; data: () => object }[] }) => void)({
        docs: [{ id: "live-1", data: () => row("live-1") }],
      });
      return jest.fn();
    }) as typeof onSnapshot);

    const { result } = renderHook(() => useBackOfficeInterventions(DEMO_COMPANY_ID));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockWhere).toHaveBeenCalledWith("companyId", "==", DEMO_COMPANY_ID);
    expect(result.current.interventions.map((r) => r.id)).toEqual(["live-1"]);
  });

  it("falls back to in-memory demo rows only when Firestore is empty", async () => {
    mockOnSnapshot.mockImplementation(((_q, onNext) => {
      (onNext as (snap: { docs: { id: string; data: () => object }[] }) => void)({ docs: [] });
      return jest.fn();
    }) as typeof onSnapshot);

    const { result } = renderHook(() => useBackOfficeInterventions(DEMO_COMPANY_ID));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.interventions).toEqual(demoInterventionsForCompany(DEMO_COMPANY_ID));
  });
});
