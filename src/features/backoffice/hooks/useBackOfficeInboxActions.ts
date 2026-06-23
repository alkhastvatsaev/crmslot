"use client";

import type { BackOfficeInboxActionsArgs } from "@/features/backoffice/backOfficeInboxActionsTypes";
import { useBackOfficeInboxAssignActions } from "@/features/backoffice/hooks/useBackOfficeInboxAssignActions";
import { useBackOfficeInboxMiscActions } from "@/features/backoffice/hooks/useBackOfficeInboxMiscActions";
import { useBackOfficeInboxReportActions } from "@/features/backoffice/hooks/useBackOfficeInboxReportActions";

export function useBackOfficeInboxActions(args: BackOfficeInboxActionsArgs) {
  const misc = useBackOfficeInboxMiscActions(args);
  const assign = useBackOfficeInboxAssignActions(args);
  const report = useBackOfficeInboxReportActions(args);

  return {
    ...misc,
    ...assign,
    ...report,
  };
}
