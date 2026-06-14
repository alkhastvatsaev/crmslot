"use client";

import { useMemo } from "react";
import { useCompanyWorkspace } from "@/context/CompanyWorkspaceContext";
import { useOfflineSyncOptional } from "@/context/OfflineSyncContext";
import { useBackOfficeInterventions } from "@/features/backoffice/useBackOfficeInterventions";
import { buildWorkspaceCopilotSnapshot } from "@/features/copilot/buildWorkspaceCopilotSnapshot";
import type { WorkspaceCopilotSnapshot } from "@/features/copilot/types";
import { useTranslation } from "@/core/i18n/I18nContext";

export function useWorkspaceCopilotSnapshot(options?: { enabled?: boolean }): {
  snapshot: WorkspaceCopilotSnapshot | null;
  loading: boolean;
} {
  const enabled = options?.enabled !== false;
  const { language } = useTranslation();
  const { activeCompanyId, activeRole, memberships } = useCompanyWorkspace();
  const { interventions, loading } = useBackOfficeInterventions(
    enabled ? activeCompanyId || null : null
  );
  const offlineSync = useOfflineSyncOptional();
  const navigatorOnline = offlineSync?.navigatorOnline ?? true;
  const pendingCompletionCount = offlineSync?.pendingCompletionCount ?? 0;

  const companyName = memberships.find((m) => m.companyId === activeCompanyId)?.companyName ?? null;

  const snapshot = useMemo(() => {
    const cid = (activeCompanyId ?? "").trim();
    if (!cid) return null;
    return buildWorkspaceCopilotSnapshot({
      locale: language,
      companyId: cid,
      companyName,
      companyRole: activeRole,
      interventions,
      pendingOfflineQueue: pendingCompletionCount,
      navigatorOnline,
    });
  }, [
    activeCompanyId,
    activeRole,
    companyName,
    interventions,
    language,
    navigatorOnline,
    pendingCompletionCount,
  ]);

  return { snapshot, loading: loading && Boolean(activeCompanyId) };
}
