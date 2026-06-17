"use client";

import CrmEmailLoginGate from "@/features/auth/components/CrmEmailLoginGate";

/** Auth terrain : connexion e-mail / mot de passe (auth CRM). */
export default function TechnicianLoginGate({ children }: { children: React.ReactNode }) {
  return <CrmEmailLoginGate variant="technician">{children}</CrmEmailLoginGate>;
}
