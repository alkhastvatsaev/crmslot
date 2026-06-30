"use client";

import { useEffect } from "react";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { prefetchCompanyStaff } from "@/features/teamHub/companyStaffCache";

/** Précharge staff dès que la société active est connue (avant navigation hub équipe). */
export default function TeamHubBootPrefetch() {
  const workspace = useCompanyWorkspaceOptional();
  const companyId = (workspace?.activeCompanyId ?? "").trim() || null;

  useEffect(() => {
    prefetchCompanyStaff(companyId);
  }, [companyId]);

  return null;
}
