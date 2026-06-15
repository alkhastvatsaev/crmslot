"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, clientPortalAuth, isConfigured } from "@/core/config/firebase";
import { devUiPreviewEnabled } from "@/core/config/devUiPreview";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { isVerifiedClientPortalUser } from "@/features/auth/hooks/useClientPortalAccount";

function isVerifiedClientPortalSession(user: User | null): boolean {
  return isVerifiedClientPortalUser(user);
}

/**
 * Bandeau quand le déploiement est en build « prod » sans preview staging :
 * explique pourquoi Demandes / missions peuvent être vides (ce n’est pas lié à l’IP).
 */
export default function StagingPreviewBanner() {
  const workspace = useCompanyWorkspaceOptional();
  const [clientPortalUser, setClientPortalUser] = useState<User | null>(
    clientPortalAuth?.currentUser ?? null
  );

  useEffect(() => {
    if (!clientPortalAuth) return;
    return onAuthStateChanged(clientPortalAuth, setClientPortalUser);
  }, []);

  if (devUiPreviewEnabled) return null;
  if (workspace?.isTenantUser) return null;
  if (isVerifiedClientPortalSession(clientPortalUser)) return null;

  const firebaseMissing = !isConfigured;
  const anonymousNoTenant =
    isConfigured && Boolean(auth?.currentUser?.isAnonymous) && !workspace?.memberships.length;

  if (!firebaseMissing && !anonymousNoTenant && workspace !== null) return null;

  const host =
    typeof window !== "undefined" && window.location.hostname
      ? window.location.hostname
      : "votre-app.vercel.app";

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      data-testid="staging-preview-banner"
      className="pointer-events-auto mx-auto mb-2 max-w-3xl rounded-[14px] border border-amber-200/80 bg-amber-50/95 px-4 py-2.5 text-center text-[12px] font-medium leading-snug text-amber-950 shadow-[0_8px_24px_-12px_rgba(245,158,11,0.35)]"
      role="status"
    >
      {firebaseMissing ? (
        <>
          Firebase n’est pas configuré sur ce déploiement (variables{" "}
          <code className="rounded bg-amber-100/80 px-1">NEXT_PUBLIC_FIREBASE_*</code> sur Vercel).
          En local, le mode démo masque souvent ce manque.
        </>
      ) : (
        <>
          Mode démo désactivé sur ce déploiement — Demandes / missions du jour vides sans compte
          société Firestore. Pour l’UX démo sur{" "}
          <code className="rounded bg-amber-100/80 px-1">{host}</code> : ajouter{" "}
          <code className="rounded bg-amber-100/80 px-1">NEXT_PUBLIC_STAGING_PREVIEW=true</code> sur
          Vercel et activer l’auth <strong>Anonyme</strong> dans Firebase, puis redéployer. Chaque
          appareil = session Firebase distincte (pas par IP).
        </>
      )}
    </motion.div>
  );
}
