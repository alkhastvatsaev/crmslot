"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { CompanyWorkspaceApi } from "@/context/companyWorkspaceContextTypes";
import { useCompanyWorkspaceState } from "@/context/useCompanyWorkspaceState";

export type { CompanyWorkspaceApi } from "@/context/companyWorkspaceContextTypes";

const CompanyWorkspaceContext = createContext<CompanyWorkspaceApi | null>(null);

export function CompanyWorkspaceProvider({
  children,
  initialActiveCompanyId,
}: {
  children: ReactNode;
  initialActiveCompanyId?: string;
}) {
  const value = useCompanyWorkspaceState(initialActiveCompanyId);

  return (
    <CompanyWorkspaceContext.Provider value={value}>{children}</CompanyWorkspaceContext.Provider>
  );
}

export function useCompanyWorkspace(): CompanyWorkspaceApi {
  const ctx = useContext(CompanyWorkspaceContext);
  if (!ctx) throw new Error("CompanyWorkspaceProvider manquant.");
  return ctx;
}

export function useCompanyWorkspaceOptional(): CompanyWorkspaceApi | null {
  return useContext(CompanyWorkspaceContext);
}
