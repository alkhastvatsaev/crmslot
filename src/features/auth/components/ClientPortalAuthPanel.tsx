"use client";

import { cn } from "@/lib/utils";
import InterventionTrackingSection from "@/features/auth/components/InterventionTrackingSection";
import ClientPortalAuthOffline from "@/features/auth/components/ClientPortalAuthOffline";
import ClientPortalAuthedView from "@/features/auth/components/ClientPortalAuthedView";
import ClientPortalAuthCard from "@/features/auth/components/ClientPortalAuthCard";
import ClientPortalAuthRailContent from "@/features/auth/components/ClientPortalAuthRailContent";
import {
  useClientPortalAuthPanel,
  type UseClientPortalAuthPanelArgs,
} from "@/features/auth/hooks/useClientPortalAuthPanel";
import type { ClientPortalAuthTab } from "@/features/auth/hooks/useClientPortalAuth";

export type ClientPortalAuthPanelProps = UseClientPortalAuthPanelArgs & {
  /** Rail gauche hub demandeur : connexion uniquement (sans suivi par nom). */
  authRailMode?: boolean;
  /** Onglet contrôlé par le hub demandeur (Connexion / Créer un compte). */
  authTab?: ClientPortalAuthTab;
};

export default function ClientPortalAuthPanel(props: ClientPortalAuthPanelProps) {
  const { authRailMode, mountCredentialFields, isOffline, auth, search } =
    useClientPortalAuthPanel(props);

  if (isOffline) {
    return <ClientPortalAuthOffline />;
  }

  const authFields = {
    authTab: auth.authTab,
    setAuthTab: auth.setAuthTab,
    email: auth.email,
    setEmail: auth.setEmail,
    password: auth.password,
    setPassword: auth.setPassword,
    confirmPassword: auth.confirmPassword,
    setConfirmPassword: auth.setConfirmPassword,
    emailAuthBusy: auth.emailAuthBusy,
    googleBusy: auth.googleBusy,
    mfaResolver: auth.mfaResolver,
    mfaHintIndex: auth.mfaHintIndex,
    phoneVerificationId: auth.phoneVerificationId,
    mfaCode: auth.mfaCode,
    setMfaCode: auth.setMfaCode,
    mfaBusy: auth.mfaBusy,
    onEmailPasswordSubmit: auth.handleEmailPasswordSubmit,
    onGoogleSignIn: auth.handleGoogleSignIn,
    onSendPhoneMfa: auth.handleSendPhoneMfa,
    onConfirmMfa: auth.handleConfirmMfa,
    onResetMfaUi: auth.resetMfaUi,
  };

  return (
    <div
      data-testid="client-portal-container"
      data-auth-rail={authRailMode ? "true" : undefined}
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-5 pb-1 w-full min-w-0",
        authRailMode ? "max-w-none" : "max-w-[440px] mx-auto"
      )}
    >
      {!authRailMode && (
        <>
          <InterventionTrackingSection
            searchName={search.searchName}
            setSearchName={search.setSearchName}
            isSearching={search.isSearching}
            searchResult={search.searchResult}
            handleSearch={search.handleSearch}
          />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-black/[0.06]"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-slate-50 px-3 text-[11px] text-slate-400 uppercase font-bold tracking-wider">
                Portail Complet
              </span>
            </div>
          </div>
        </>
      )}

      {auth.user && !authRailMode ? (
        <ClientPortalAuthedView user={auth.user} onGoDashboard={auth.goDashboard} />
      ) : authRailMode ? (
        mountCredentialFields ? (
          <ClientPortalAuthRailContent {...authFields} />
        ) : null
      ) : (
        <ClientPortalAuthCard {...authFields} />
      )}
    </div>
  );
}
