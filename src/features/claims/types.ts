export type ClaimStatus = "open" | "in_review" | "resolved" | "rejected";
export type ClaimCategory = "quality" | "delay" | "billing" | "material" | "other";

export interface Claim {
  id: string;
  companyId: string;
  interventionId: string;
  clientId?: string | null;
  status: ClaimStatus;
  category: ClaimCategory;
  description: string;
  resolution?: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
  createdByUid?: string | null;
  assignedToUid?: string | null;
  clientName?: string | null;
}

export const CLAIM_STATUS_LABELS: Record<ClaimStatus, string> = {
  open: "Ouverte",
  in_review: "En cours",
  resolved: "Résolue",
  rejected: "Rejetée",
};

export const CLAIM_CATEGORY_LABELS: Record<ClaimCategory, string> = {
  quality: "Qualité",
  delay: "Délai",
  billing: "Facturation",
  material: "Matériel",
  other: "Autre",
};

export const CLAIM_STATUS_STYLES: Record<ClaimStatus, string> = {
  open: "bg-red-100 text-red-700",
  in_review: "bg-amber-100 text-amber-700",
  resolved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-slate-100 text-slate-500",
};
