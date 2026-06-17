"use client";

import { isConfigured } from "@/core/config/firebase";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";

/** Bandeau quand Firebase ou membership société manquent (plus de mode démo). */
export default function WorkspaceRequiredPanel() {
  const workspace = useCompanyWorkspaceOptional();

  if (workspace?.isTenantUser) return null;
  if (!workspace || workspace.workspaceReady !== true) return null;

  const firebaseMissing = !isConfigured;
  const needsLogin = isConfigured && !workspace.firebaseUid;
  const needsMembership =
    isConfigured && Boolean(workspace.firebaseUid) && workspace.memberships.length === 0;

  if (!firebaseMissing && !needsLogin && !needsMembership) return null;

  const joinError = workspace.membershipJoinError;

  return (
    <div
      data-testid="workspace-required-banner"
      className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs font-medium text-amber-900"
    >
      {firebaseMissing
        ? "Configuration Firebase manquante — renseignez .env.local (voir .env.example)."
        : needsLogin
          ? "Connectez-vous avec un compte administrateur ou technicien pour accéder à l’espace société."
          : joinError
            ? `Rattachement à la société impossible : ${joinError}`
            : "Aucune société associée à ce compte — contactez un administrateur pour recevoir une invitation."}
      {needsMembership && joinError ? (
        <button
          type="button"
          data-testid="workspace-retry-company-join"
          className="ml-2 underline underline-offset-2"
          disabled={workspace.membershipJoinPending}
          onClick={() => void workspace.retryDefaultCompanyJoin()}
        >
          Réessayer
        </button>
      ) : null}
    </div>
  );
}
