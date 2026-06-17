"use client";

import CrmEmailLoginGate from "@/features/auth/components/CrmEmailLoginGate";

/** Auth admin : même écran de connexion que l'app technicien. */
export default function LoginOverlay({ children }: { children: React.ReactNode }) {
  return <CrmEmailLoginGate variant="admin">{children}</CrmEmailLoginGate>;
}
