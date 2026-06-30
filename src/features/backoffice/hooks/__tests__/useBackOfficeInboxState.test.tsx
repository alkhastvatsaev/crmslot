import React from "react";
import { renderHook } from "@testing-library/react";
import { I18nProvider } from "@/core/i18n/I18nContext";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { useFirestoreLiveEnabled } from "@/core/perf/useFirestoreLiveEnabled";
import { useBackOfficeInterventions } from "@/features/backoffice/useBackOfficeInterventions";
import { useBackOfficeInboxSelection } from "@/features/backoffice/hooks/useBackOfficeInboxSelection";
import { useBackOfficeInboxPortalChat } from "@/features/backoffice/hooks/useBackOfficeInboxPortalChat";
import { useBackOfficeInboxTerrainBridge } from "@/features/backoffice/hooks/useBackOfficeInboxTerrainBridge";
import { useBackOfficeInboxActions } from "@/features/backoffice/hooks/useBackOfficeInboxActions";
import { useBackOfficeInboxState } from "@/features/backoffice/hooks/useBackOfficeInboxState";
import type { Intervention } from "@/features/interventions";

jest.mock("@/context/CompanyWorkspaceContext", () => ({
  useCompanyWorkspaceOptional: jest.fn(),
}));

jest.mock("@/context/DateContext", () => ({
  useDateContext: () => ({ selectedDate: new Date("2026-06-30") }),
}));

jest.mock("@/context/BackofficeInboxIntentContext", () => ({
  useBackofficeInboxIntentOptional: () => null,
}));

jest.mock("@/context/TechnicianBackofficeReportBridgeContext", () => ({
  useTechnicianBackofficeReportBridgeOptional: () => ({ reports: [] }),
}));

jest.mock("@/core/perf/useFirestoreLiveEnabled", () => ({
  useFirestoreLiveEnabled: jest.fn(() => true),
}));

jest.mock("@/core/useFeatureFlags", () => ({
  useFeatureFlag: () => false,
}));

jest.mock("@/features/crmHistory/useActivityLog", () => ({
  useActivityLog: () => ({ logIntervention: jest.fn() }),
}));

jest.mock("@/features/backoffice/useBackOfficeInterventions", () => ({
  useBackOfficeInterventions: jest.fn(),
}));

jest.mock("@/features/backoffice/useResolvedInterventionAudio", () => ({
  useResolvedInterventionAudio: jest.fn(() => ({
    resolvedAudioUrl: null,
    isResolvingAudio: false,
    audioStorageResolveFailed: false,
  })),
}));

jest.mock("@/features/reminders/useBackofficeReminderPush", () => ({
  useBackofficeReminderPush: jest.fn(),
}));

jest.mock("@/features/backoffice/hooks/useBackOfficeInboxSelection", () => ({
  useBackOfficeInboxSelection: jest.fn(),
}));

jest.mock("@/features/backoffice/hooks/useBackOfficeInboxPortalChat", () => ({
  useBackOfficeInboxPortalChat: jest.fn(),
}));

jest.mock("@/features/backoffice/hooks/useBackOfficeInboxTerrainBridge", () => ({
  useBackOfficeInboxTerrainBridge: jest.fn(),
}));

jest.mock("@/features/backoffice/hooks/useBackOfficeInboxActions", () => ({
  useBackOfficeInboxActions: jest.fn(),
}));

const workspaceMock = useCompanyWorkspaceOptional as jest.MockedFunction<
  typeof useCompanyWorkspaceOptional
>;
const interventionsMock = useBackOfficeInterventions as jest.MockedFunction<
  typeof useBackOfficeInterventions
>;
const selectionMock = useBackOfficeInboxSelection as jest.MockedFunction<
  typeof useBackOfficeInboxSelection
>;
const portalChatMock = useBackOfficeInboxPortalChat as jest.MockedFunction<
  typeof useBackOfficeInboxPortalChat
>;
const terrainBridgeMock = useBackOfficeInboxTerrainBridge as jest.MockedFunction<
  typeof useBackOfficeInboxTerrainBridge
>;
const actionsMock = useBackOfficeInboxActions as jest.MockedFunction<
  typeof useBackOfficeInboxActions
>;
const liveMock = useFirestoreLiveEnabled as jest.MockedFunction<typeof useFirestoreLiveEnabled>;

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

function selectionStub(overrides: Record<string, unknown> = {}) {
  return {
    activeTab: "requests" as const,
    setActiveTab: jest.fn(),
    selectedItemId: null,
    setSelectedItemId: jest.fn(),
    selectedItem: null,
    selectedChatInterventionId: null,
    setSelectedChatInterventionId: jest.fn(),
    dragBoardTechUid: "",
    setDragBoardTechUid: jest.fn(),
    dragBoardDate: "2026-06-30",
    setDragBoardDate: jest.fn(),
    isEditingDateTime: false,
    setIsEditingDateTime: jest.fn(),
    editDate: "",
    setEditDate: jest.fn(),
    editTime: "",
    setEditTime: jest.fn(),
    reportsArchiveExpanded: false,
    setReportsArchiveExpanded: jest.fn(),
    assignPickerOpen: false,
    setAssignPickerOpen: jest.fn(),
    isAssigning: false,
    setIsAssigning: jest.fn(),
    selectedTerrainLocalId: null,
    setSelectedTerrainLocalId: jest.fn(),
    ...overrides,
  };
}

function interventionsReturn(interventions: Intervention[]) {
  return {
    interventions,
    loading: false,
    error: null,
    firebaseUid: "uid-tenant",
    fromCache: false,
  };
}

function hookWrapper({ children }: { children: React.ReactNode }) {
  return <I18nProvider>{children}</I18nProvider>;
}

describe("useBackOfficeInboxState", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    liveMock.mockReturnValue(true);
    selectionMock.mockReturnValue(selectionStub());
    portalChatMock.mockReturnValue({
      chatDayRows: [],
      chatThreadsNeedingReply: 0,
      chatThreadsNeedingReplyIds: new Set<string>(),
    });
    terrainBridgeMock.mockReturnValue({
      selectedReportCompletion: { photoUrls: [], signatureUrl: null },
      terrainIv: null,
    });
    actionsMock.mockReturnValue({
      handleAssignTechnician: jest.fn(),
      handleRejectRequest: jest.fn(),
    } as unknown as ReturnType<typeof useBackOfficeInboxActions>);
    interventionsMock.mockReturnValue(interventionsReturn([]));
  });

  // Régression : pas de requête Firestore sans société — 2026-06-30
  it("ne charge pas Firestore sans société workspace", () => {
    workspaceMock.mockReturnValue(null);

    renderHook(() => useBackOfficeInboxState(), { wrapper: hookWrapper });

    expect(interventionsMock).toHaveBeenCalledWith(null, { enabled: true });
  });

  // Régression : inbox réservée aux comptes tenant — 2026-06-30
  it("ne charge pas Firestore pour un staff non-tenant", () => {
    workspaceMock.mockReturnValue({
      activeCompanyId: "co-1",
      memberships: [{ companyId: "co-1", companyName: "Co", role: "admin" }],
      workspaceReady: true,
      isTenantUser: false,
    } as unknown as ReturnType<typeof useCompanyWorkspaceOptional>);

    renderHook(() => useBackOfficeInboxState(), { wrapper: hookWrapper });

    expect(interventionsMock).toHaveBeenCalledWith(null, { enabled: true });
  });

  it("agrège pendingRequests et itemsToShow sur l'onglet demandes", () => {
    const pending = iv({ id: "p1", status: "pending" });
    workspaceMock.mockReturnValue({
      activeCompanyId: "co-1",
      memberships: [{ companyId: "co-1", companyName: "Co", role: "admin" }],
      workspaceReady: true,
      isTenantUser: true,
    } as unknown as ReturnType<typeof useCompanyWorkspaceOptional>);
    interventionsMock.mockReturnValue(interventionsReturn([pending]));

    const { result } = renderHook(() => useBackOfficeInboxState(), { wrapper: hookWrapper });

    expect(result.current.pendingRequests).toEqual([pending]);
    expect(result.current.itemsToShow).toEqual([pending]);
    expect(interventionsMock).toHaveBeenCalledWith(["co-1"], { enabled: true });
  });

  it("calcule reportsTabBadgeCount sur l'onglet rapports", () => {
    const awaiting = iv({
      id: "a1",
      status: "assigned",
      assignedTechnicianUid: "tech-1",
    });
    const done = iv({ id: "d1", status: "done", completedAt: "2026-06-30" });
    workspaceMock.mockReturnValue({
      activeCompanyId: "co-1",
      memberships: [{ companyId: "co-1", companyName: "Co", role: "admin" }],
      workspaceReady: true,
      isTenantUser: true,
    } as unknown as ReturnType<typeof useCompanyWorkspaceOptional>);
    interventionsMock.mockReturnValue(interventionsReturn([awaiting, done]));
    selectionMock.mockReturnValue(selectionStub({ activeTab: "reports" }));

    const { result } = renderHook(() => useBackOfficeInboxState(), { wrapper: hookWrapper });

    expect(result.current.reportsTabBadgeCount).toBe(2);
    expect(result.current.itemsToShow.map((r) => r.id)).toEqual(["a1", "d1"]);
  });

  it("propage inboxDataActive à useFirestoreLiveEnabled", () => {
    workspaceMock.mockReturnValue({
      activeCompanyId: "co-1",
      memberships: [{ companyId: "co-1", companyName: "Co", role: "admin" }],
      workspaceReady: true,
      isTenantUser: true,
    } as unknown as ReturnType<typeof useCompanyWorkspaceOptional>);
    liveMock.mockReturnValue(false);

    renderHook(() => useBackOfficeInboxState(undefined, { inboxDataActive: false }), {
      wrapper: hookWrapper,
    });

    expect(liveMock).toHaveBeenCalledWith(false);
    expect(interventionsMock).toHaveBeenCalledWith(["co-1"], { enabled: false });
  });

  it("editScheduleConflicts reste vide hors édition date/heure", () => {
    const assigned = iv({
      id: "a1",
      status: "assigned",
      assignedTechnicianUid: "tech-1",
      scheduledDate: "2026-06-30",
      scheduledTime: "09:00",
    });
    workspaceMock.mockReturnValue({
      activeCompanyId: "co-1",
      memberships: [{ companyId: "co-1", companyName: "Co", role: "admin" }],
      workspaceReady: true,
      isTenantUser: true,
    } as unknown as ReturnType<typeof useCompanyWorkspaceOptional>);
    interventionsMock.mockReturnValue(interventionsReturn([assigned]));
    selectionMock.mockReturnValue(
      selectionStub({
        selectedItem: assigned,
        selectedItemId: "a1",
        isEditingDateTime: false,
        editDate: "2026-06-30",
        editTime: "10:00",
      })
    );

    const { result } = renderHook(() => useBackOfficeInboxState(), { wrapper: hookWrapper });

    expect(result.current.editScheduleConflicts).toEqual([]);
    expect(result.current.intakeProposedSlots).toEqual([]);
  });
});
