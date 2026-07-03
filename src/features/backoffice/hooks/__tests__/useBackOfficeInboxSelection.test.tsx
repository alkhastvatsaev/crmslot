import { act, renderHook, waitFor } from "@testing-library/react";
import { useMobileHubLayout } from "@/context/LayoutShellContext";
import type { BackofficeInboxIntentApi } from "@/context/BackofficeInboxIntentContext";
import { useBackOfficeInboxSelection } from "@/features/backoffice/hooks/useBackOfficeInboxSelection";
import type { Intervention } from "@/features/interventions";

jest.mock("@/context/LayoutShellContext", () => ({
  useMobileHubLayout: jest.fn(),
}));

const mobileHubLayoutMock = useMobileHubLayout as jest.MockedFunction<typeof useMobileHubLayout>;

function iv(
  partial: Partial<Intervention> & { id: string; status: Intervention["status"] }
): Intervention {
  const { id, ...rest } = partial;
  return {
    title: "T",
    address: "A",
    time: "10:00",
    location: { lat: 1, lng: 2 },
    ...rest,
    id,
  };
}

function intentStub(overrides: Partial<BackofficeInboxIntentApi> = {}): BackofficeInboxIntentApi {
  return {
    pendingInboxId: null,
    setPendingInboxId: jest.fn(),
    selectedInboxInterventionId: null,
    setSelectedInboxInterventionId: jest.fn(),
    pendingChatInterventionId: null,
    setPendingChatInterventionId: jest.fn(),
    activeInboxTab: null,
    setActiveInboxTab: jest.fn(),
    ...overrides,
  };
}

function renderSelection(
  interventions: Intervention[],
  inboxIntent: BackofficeInboxIntentApi | null = null,
  logIntervention = jest.fn()
) {
  return renderHook(() =>
    useBackOfficeInboxSelection({ interventions, inboxIntent, logIntervention })
  );
}

describe("useBackOfficeInboxSelection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mobileHubLayoutMock.mockReturnValue(false);
  });

  it("démarre sur chat desktop et demandes en hub mobile", () => {
    const { result: desktop } = renderSelection([]);
    expect(desktop.current.activeTab).toBe("chat");

    mobileHubLayoutMock.mockReturnValue(true);
    const { result: mobile } = renderSelection([]);
    expect(mobile.current.activeTab).toBe("requests");
  });

  // Régression : intent pendingInboxId ouvre demandes — 2026-06-30
  it("consomme pendingInboxId et sélectionne le dossier", async () => {
    const pending = iv({ id: "req-1", status: "pending" });
    const intent = intentStub({ pendingInboxId: "req-1" });
    const logIntervention = jest.fn();

    const { result } = renderSelection([pending], intent, logIntervention);

    await waitFor(() => {
      expect(result.current.activeTab).toBe("requests");
      expect(result.current.selectedItemId).toBe("req-1");
    });
    expect(intent.setPendingInboxId).toHaveBeenCalledWith(null);
    expect(intent.setSelectedInboxInterventionId).toHaveBeenCalledWith("req-1");
    expect(logIntervention).toHaveBeenCalledWith(pending);
  });

  it("consomme pendingChatInterventionId et bascule sur chat", async () => {
    const intent = intentStub({ pendingChatInterventionId: "chat-42" });

    const { result } = renderSelection([], intent);

    await waitFor(() => {
      expect(result.current.activeTab).toBe("chat");
      expect(result.current.selectedChatInterventionId).toBe("chat-42");
    });
    expect(intent.setPendingChatInterventionId).toHaveBeenCalledWith(null);
  });

  it("setSelectedItemId synchronise l'intent et journalise le dossier", () => {
    const done = iv({ id: "d1", status: "done", completedAt: "2026-06-30" });
    const intent = intentStub();
    const logIntervention = jest.fn();
    const { result } = renderSelection([done], intent, logIntervention);

    act(() => {
      result.current.setSelectedItemId("d1");
    });

    expect(result.current.selectedItem).toEqual(done);
    expect(intent.setSelectedInboxInterventionId).toHaveBeenCalledWith("d1");
    expect(logIntervention).toHaveBeenCalledWith(done);
  });

  it("repousse une demande pending vers l'onglet demandes depuis rapports", async () => {
    const pending = iv({ id: "p1", status: "pending" });
    const { result } = renderSelection([pending]);

    act(() => {
      result.current.setActiveTab("reports");
    });
    act(() => {
      result.current.setSelectedItemId("p1");
    });

    await waitFor(() => {
      expect(result.current.activeTab).toBe("requests");
      expect(result.current.selectedItemId).toBe("p1");
    });
  });

  it("désélectionne un dossier hors file rapports", async () => {
    const onField = iv({
      id: "f1",
      status: "in_progress",
      technicianAcceptedAt: "2026-06-30",
      assignedTechnicianUid: "tech-1",
    });
    const { result } = renderSelection([onField]);

    act(() => {
      result.current.setActiveTab("reports");
    });
    act(() => {
      result.current.setSelectedItemId("f1");
    });

    await waitFor(() => {
      expect(result.current.selectedItemId).toBeNull();
    });
  });

  it("replie l'archive rapports en quittant l'onglet", () => {
    const { result } = renderSelection([]);

    act(() => {
      result.current.setActiveTab("reports");
      result.current.setReportsArchiveExpanded(true);
    });
    expect(result.current.reportsArchiveExpanded).toBe(true);

    act(() => {
      result.current.setActiveTab("requests");
    });
    expect(result.current.reportsArchiveExpanded).toBe(false);
  });

  it("publie l'onglet actif vers l'intent context", async () => {
    const intent = intentStub();
    const { result } = renderSelection([], intent);

    act(() => {
      result.current.setActiveTab("reports");
    });

    await waitFor(() => {
      expect(intent.setActiveInboxTab).toHaveBeenCalledWith("reports");
    });
  });
});
