"use client";

import { useEffect, useState } from "react";
import { firestore } from "@/core/config/firebase";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import {
  subscribeCompanyTimeEntries,
  subscribeTimeEntries,
  subscribeTimeEntriesByIntervention,
} from "../timetrackingFirestore";
import type { TimeEntry } from "../types";

export function useTimeEntries(technicianUid: string | null | undefined) {
  const workspace = useCompanyWorkspaceOptional();
  const companyId = workspace?.activeCompanyId?.trim() ?? "";
  const [entries, setEntries] = useState<TimeEntry[]>([]);

  useEffect(() => {
    if (!firestore || !companyId || !technicianUid?.trim()) {
      setEntries([]);
      return;
    }
    return subscribeTimeEntries(firestore, companyId, technicianUid.trim(), setEntries);
  }, [companyId, technicianUid]);

  return entries;
}

export function useCompanyTimeEntries(enabled = true) {
  const workspace = useCompanyWorkspaceOptional();
  const companyId = workspace?.activeCompanyId?.trim() ?? "";
  const [entries, setEntries] = useState<TimeEntry[]>([]);

  useEffect(() => {
    if (!enabled || !firestore || !companyId) {
      setEntries([]);
      return;
    }
    return subscribeCompanyTimeEntries(firestore, companyId, setEntries);
  }, [companyId, enabled]);

  return entries;
}

export function useInterventionTimeEntries(interventionId: string | null | undefined) {
  const workspace = useCompanyWorkspaceOptional();
  const companyId = workspace?.activeCompanyId?.trim() ?? "";
  const [entries, setEntries] = useState<TimeEntry[]>([]);

  useEffect(() => {
    if (!firestore || !companyId || !interventionId?.trim()) {
      setEntries([]);
      return;
    }
    return subscribeTimeEntriesByIntervention(
      firestore,
      companyId,
      interventionId.trim(),
      setEntries
    );
  }, [companyId, interventionId]);

  return entries;
}
