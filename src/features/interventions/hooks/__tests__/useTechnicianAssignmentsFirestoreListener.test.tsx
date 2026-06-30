import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { onAuthStateChanged } from "firebase/auth";
import { onSnapshot } from "firebase/firestore";
import { useTechnicianAssignmentsFirestoreListener } from "@/features/interventions/hooks/useTechnicianAssignmentsFirestoreListener";

jest.mock("firebase/auth", () => ({
  onAuthStateChanged: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
  onSnapshot: jest.fn(),
}));

jest.mock("@/core/config/firebase", () => ({
  auth: { currentUser: null },
  firestore: {},
}));

jest.mock("@/features/interventions/technicianAssignmentsQuery", () => ({
  technicianAssignmentsFirestoreQuery: jest.fn(() => ({})),
  fetchTechnicianAssignments: jest.fn(() => Promise.resolve([])),
}));

const onAuthStateChangedMock = onAuthStateChanged as jest.MockedFunction<typeof onAuthStateChanged>;
const onSnapshotMock = onSnapshot as jest.MockedFunction<typeof onSnapshot>;

function renderListener(
  overrides: Partial<Parameters<typeof useTechnicianAssignmentsFirestoreListener>[0]> = {}
) {
  const queryClient = new QueryClient();
  const syncFromServerRef = { current: null as (() => Promise<void>) | null };
  const listenerHydratedRef = { current: false };
  const knownAssignmentIdsRef = { current: new Set<string>() };
  const setFirebaseUid = jest.fn();
  const setError = jest.fn();
  const setSnapshotReady = jest.fn();

  const params = {
    hookEnabled: true,
    noFirebaseAuth: false,
    queryClient,
    syncFromServerRef,
    listenerHydratedRef,
    knownAssignmentIdsRef,
    setFirebaseUid,
    setError,
    setSnapshotReady,
    ...overrides,
  };

  renderHook(() => useTechnicianAssignmentsFirestoreListener(params), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });

  return { setFirebaseUid, setError, setSnapshotReady, queryClient };
}

describe("useTechnicianAssignmentsFirestoreListener — CODEX mobile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    onAuthStateChangedMock.mockImplementation((_auth, next) => {
      const callback = typeof next === "function" ? next : next.next;
      queueMicrotask(() => callback?.(null));
      return jest.fn();
    });
    onSnapshotMock.mockReturnValue(jest.fn());
  });

  it("n'appelle pas onSnapshot quand firebaseUid est null (déconnecté)", async () => {
    const { setFirebaseUid, setSnapshotReady } = renderListener();

    await waitFor(() => {
      expect(setFirebaseUid).toHaveBeenCalledWith(null);
    });

    expect(onSnapshotMock).not.toHaveBeenCalled();
    expect(setSnapshotReady).toHaveBeenCalledWith(true);
  });

  it("no-op si Firebase non configuré", () => {
    renderListener({ noFirebaseAuth: true });
    expect(onAuthStateChangedMock).not.toHaveBeenCalled();
    expect(onSnapshotMock).not.toHaveBeenCalled();
  });

  it("no-op si hook désactivé", () => {
    renderListener({ hookEnabled: false });
    expect(onAuthStateChangedMock).not.toHaveBeenCalled();
  });
});
