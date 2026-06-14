"use client";

import type { Intervention } from "@/features/interventions/types";
import type { RequesterProfile } from "@/features/interventions/context/RequesterHubContext";
import { useClientPortalInterventions } from "@/features/interventions/hooks/useClientPortalInterventions";

export type PortalInterventionRow = Pick<
  Intervention,
  | "id"
  | "status"
  | "invoicePdfUrl"
  | "billingLines"
  | "invoiceAmountCents"
  | "createdAt"
  | "problem"
  | "title"
  | "paymentStatus"
  | "stripePaymentLinkUrl"
  | "clientEmail"
  | "clientFirstName"
  | "clientLastName"
  | "clientCompanyName"
  | "clientPhone"
>;

type ProfileSlice = Pick<
  RequesterProfile,
  "type" | "firstName" | "lastName" | "phone" | "email" | "companyName"
>;

/** Dossiers du client connecté — filtrés par identité (e-mail / nom / téléphone). */
export function useRequesterPortalInterventions(profile: ProfileSlice) {
  return useClientPortalInterventions<PortalInterventionRow>({ profile });
}
