import type { TechnicianBackofficeReportBridgeApi } from "@/context/TechnicianBackofficeReportBridgeContext";
import type { BackOfficeInboxTab } from "@/features/backoffice/backOfficeInboxTypes";
import type { Intervention } from "@/features/interventions";

export type BackOfficeInboxActionsArgs = {
  interventions: Intervention[];
  selectedItem: Intervention | null;
  dragBoardTechUid: string;
  dragBoardDate: string;
  editDate: string;
  editTime: string;
  terrainBridge: TechnicianBackofficeReportBridgeApi | null;
  setSelectedItemId: (id: string | null) => void;
  setSelectedTerrainLocalId: (id: string | null) => void;
  setActiveTab: (tab: BackOfficeInboxTab) => void;
  setAssignPickerOpen: (open: boolean) => void;
  setIsAssigning: (assigning: boolean) => void;
  setIsEditingDateTime: (editing: boolean) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
};

export type BackOfficeInboxTranslate = BackOfficeInboxActionsArgs["t"];
