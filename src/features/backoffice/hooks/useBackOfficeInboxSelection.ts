"use client";

import { useEffect, useMemo, useState } from "react";
import { useMobileHubLayout } from "@/context/LayoutShellContext";
import type { BackofficeInboxIntentApi } from "@/context/BackofficeInboxIntentContext";
import type { BackOfficeInboxTab } from "@/features/backoffice/backOfficeInboxTypes";
import type { Intervention } from "@/features/interventions";
import { isInterventionInBackofficeRequestsQueue } from "@/features/interventions/technicianSchedule";
import { isBackofficeReportInInboxArchive } from "@/features/backoffice/backofficeReportsInboxArchive";
import { isInterventionInBackofficeReportsInboxQueue } from "@/features/backoffice/backOfficeInboxLists";

type SelectionArgs = {
  interventions: Intervention[];
  inboxIntent: BackofficeInboxIntentApi | null;
  logIntervention: (iv: Intervention) => void;
};

export function useBackOfficeInboxSelection({
  interventions,
  inboxIntent,
  logIntervention,
}: SelectionArgs) {
  const mobileHubLayout = useMobileHubLayout();
  const [activeTab, setActiveTab] = useState<BackOfficeInboxTab>(() =>
    mobileHubLayout ? "requests" : "chat"
  );
  const [selectedItemId, setSelectedItemIdLocal] = useState<string | null>(null);
  const [selectedChatInterventionId, setSelectedChatInterventionId] = useState<string | null>(null);
  const [dragBoardTechUid, setDragBoardTechUid] = useState("");
  const [dragBoardDate, setDragBoardDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [isEditingDateTime, setIsEditingDateTime] = useState(false);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [reportsArchiveExpanded, setReportsArchiveExpanded] = useState(false);
  const [assignPickerOpen, setAssignPickerOpen] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedTerrainLocalId, setSelectedTerrainLocalId] = useState<string | null>(null);

  const [prevActiveTab, setPrevActiveTab] = useState(activeTab);
  if (prevActiveTab !== activeTab) {
    setPrevActiveTab(activeTab);
    if (activeTab !== "reports") setReportsArchiveExpanded(false);
  }

  const setSelectedItemId = (id: string | null) => {
    const next = id?.trim() ? id.trim() : null;
    setSelectedItemIdLocal(next);
    inboxIntent?.setSelectedInboxInterventionId(next);
    if (next) {
      const iv = interventions.find((x) => x.id === next);
      if (iv) logIntervention(iv);
    }
  };

  const selectedItem = useMemo(
    () => (selectedItemId ? (interventions.find((x) => x.id === selectedItemId) ?? null) : null),
    [interventions, selectedItemId]
  );

  useEffect(() => {
    const pending = inboxIntent?.pendingInboxId?.trim();
    if (!pending) return;
    setSelectedItemId(pending);
    setActiveTab("requests");
    inboxIntent?.setPendingInboxId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inboxIntent?.pendingInboxId, inboxIntent]);

  useEffect(() => {
    const pendingChat = inboxIntent?.pendingChatInterventionId?.trim();
    if (!pendingChat) return;
    setSelectedChatInterventionId(pendingChat);
    setActiveTab("chat");
    inboxIntent?.setPendingChatInterventionId(null);
  }, [inboxIntent?.pendingChatInterventionId, inboxIntent]);

  useEffect(() => {
    inboxIntent?.setActiveInboxTab(activeTab);
  }, [activeTab, inboxIntent]);

  useEffect(() => {
    if (!selectedItemId || activeTab !== "reports") return;
    const iv = interventions.find((x) => x.id === selectedItemId);
    if (!iv) return;
    if (isInterventionInBackofficeRequestsQueue(iv)) {
      setActiveTab("requests");
      return;
    }
    if (!isInterventionInBackofficeReportsInboxQueue(iv) && !isBackofficeReportInInboxArchive(iv)) {
      setSelectedItemId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItemId, interventions, activeTab]);

  return {
    activeTab,
    setActiveTab,
    selectedItemId,
    setSelectedItemId,
    selectedItem,
    selectedChatInterventionId,
    setSelectedChatInterventionId,
    dragBoardTechUid,
    setDragBoardTechUid,
    dragBoardDate,
    setDragBoardDate,
    isEditingDateTime,
    setIsEditingDateTime,
    editDate,
    setEditDate,
    editTime,
    setEditTime,
    reportsArchiveExpanded,
    setReportsArchiveExpanded,
    assignPickerOpen,
    setAssignPickerOpen,
    isAssigning,
    setIsAssigning,
    selectedTerrainLocalId,
    setSelectedTerrainLocalId,
  };
}
