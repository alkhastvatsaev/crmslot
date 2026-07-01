import { toast } from "sonner";
import {
  collection,
  doc,
  setDoc,
  type DocumentReference,
  type Firestore,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import type { RequesterProfile } from "@/context/RequesterHubContext";
import { resolveRequesterSubmitClients } from "@/features/interventions/requesterInterventionSubmitClients";
import { logger } from "@/core/logger";
import { logCrmInterventionCreated } from "@/features/crmHistory/logCrmInterventionCreated";
import { ensureRequesterUserForSubmit } from "@/features/interventions/requesterInterventionFormHelpers";
import { capitalizeName } from "@/utils/stringUtils";
import {
  notifyRequesterPortalAccess,
  runRequesterSubmitBackgroundTasks,
} from "@/features/interventions/requesterInterventionSubmitBackground";
import {
  buildRequesterInterventionDocPayload,
  resolveRequesterClientFields,
  resolveRequesterSubmitAudioUrl,
} from "@/features/interventions/requesterInterventionSubmitPayload";
import {
  findRequesterDuplicateInterventions,
  geocodeRequesterInterventionAddress,
} from "@/features/interventions/requesterInterventionSubmitQueries";
import {
  validateRequesterInterventionSubmit,
  type RequesterInterventionSubmitInput,
} from "@/features/interventions/requesterInterventionSubmitValidation";
import { triggerRequesterMobileHaptic } from "@/features/interventions/requesterMobileHaptics";

export type { RequesterInterventionSubmitInput } from "@/features/interventions/requesterInterventionSubmitValidation";

async function persistRequesterInterventionDoc(params: {
  profileType: RequesterProfile["type"];
  db: Firestore;
  user: User;
  newDocRef: DocumentReference;
  companyId: string;
  docPayload: Record<string, unknown>;
}): Promise<void> {
  const { profileType, user, newDocRef, companyId, docPayload } = params;

  if (profileType === "particulier") {
    const res = await fetchWithAuth(
      "/api/interventions/public-request",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          interventionId: newDocRef.id,
          payload: docPayload,
        }),
      },
      { user }
    );
    const body = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    if (!res.ok || body.ok === false) {
      throw Object.assign(new Error(body.error ?? `HTTP ${res.status}`), {
        code: res.status === 403 ? "permission-denied" : undefined,
      });
    }
    return;
  }

  await setDoc(newDocRef, docPayload);
}

export async function submitRequesterIntervention(
  input: RequesterInterventionSubmitInput
): Promise<void> {
  const {
    profile,
    clientAccountFields,
    requestData,
    tenantCompanyId,
    interventionCompanyId,
    isTenantUser,
    locale,
    t,
    triggerValidation,
    setIsSubmitting,
    setLastSubmittedInterventionId,
    setPendingTrackingInterventionId,
    setPortalRightTab,
    setLastSubmittedRequest,
    resetRequestAfterSubmit,
    setLastSubmittedPortalAccessCode,
    onInboxPendingId,
    onNavigateMap,
    onFocusMobileRail,
    onSwitchToParticulierTab,
  } = input;

  const validation = validateRequesterInterventionSubmit({
    profile,
    clientAccountFields,
    requestData,
    tenantCompanyId,
    interventionCompanyId,
    isTenantUser,
    t,
  });

  if (!validation.ok) {
    if (validation.triggerValidation) triggerValidation();
    if (validation.switchToParticulierTab) onSwitchToParticulierTab?.();
    if (validation.focusMobileRail) onFocusMobileRail?.(validation.focusMobileRail);
    toast.error(validation.message);
    return;
  }

  setIsSubmitting(true);
  try {
    const authUser = await ensureRequesterUserForSubmit(profile.type);
    const clients = authUser ? resolveRequesterSubmitClients(profile.type, authUser) : null;
    if (!clients) {
      toast.error(String(t("requester.toasts.auth_failed")));
      return;
    }
    const { db, storage: submitStorage, user } = clients;

    const companyId = interventionCompanyId!;
    const matches = await findRequesterDuplicateInterventions({
      db,
      user,
      tenantCompanyId,
      interventionCompanyId: companyId,
      profile,
      requestData,
    });

    if (matches.length > 0) {
      toast.error("VOTRE ENTREPRISE A DEJA FAIT CETTE DEMANDE", {
        description: "Une demande identique a déjà été soumise.",
      });
      return;
    }

    const audioUrlForDoc = await resolveRequesterSubmitAudioUrl(requestData);
    const newDocRef = doc(collection(db, "interventions"));
    setLastSubmittedInterventionId(newDocRef.id);
    setPendingTrackingInterventionId(newDocRef.id);
    setPortalRightTab("tracking");

    const problemForDedupe = requestData.description.trim() || requestData.problemLabel.trim();
    const title = (requestData.problemLabel.trim() || requestData.description.trim()).slice(0, 140);

    let lat = requestData.interventionLatLng?.lat;
    let lng = requestData.interventionLatLng?.lng;
    if (lat === undefined || lng === undefined) {
      const coords = await geocodeRequesterInterventionAddress(requestData.interventionAddress);
      lat = coords.lat;
      lng = coords.lng;
    }

    const clientFields = resolveRequesterClientFields({
      profile,
      clientAccountFields,
      user,
    });

    const { portalAccessFields } = await import("@/features/interventions/ensurePortalAccessToken");
    const { formatPortalAccessCode } = await import("@/features/interventions/portalAccessCode");
    const portalFields = portalAccessFields();

    const docPayload = await buildRequesterInterventionDocPayload({
      requestData,
      interventionCompanyId: companyId,
      user,
      clientFields,
      audioUrlForDoc,
      locale,
      lat,
      lng,
      portalFields,
    });

    await persistRequesterInterventionDoc({
      profileType: profile.type,
      db,
      user,
      newDocRef,
      companyId,
      docPayload,
    });

    const { clientFirstRaw, clientLastRaw, clientEmailRaw } = clientFields;

    void logCrmInterventionCreated({
      intervention: {
        id: newDocRef.id,
        title,
        address: requestData.interventionAddress.trim(),
        status: "pending",
        companyId,
        ...(clientFirstRaw ? { clientFirstName: capitalizeName(clientFirstRaw) } : {}),
        ...(clientLastRaw ? { clientLastName: capitalizeName(clientLastRaw) } : {}),
      },
      actorUid: user.uid,
      actorRole: "client",
      source: "hub_requester_panel",
    });

    runRequesterSubmitBackgroundTasks({
      db,
      storage: submitStorage,
      newDocRef,
      user,
      interventionCompanyId: companyId,
      interventionAddress: requestData.interventionAddress,
      problemForDedupe,
      profile,
      clientFields,
      audioBlob: requestData.audioBlob,
    });

    onInboxPendingId?.(newDocRef.id);
    onNavigateMap?.();

    setLastSubmittedRequest({
      problemTemplateId: requestData.problemTemplateId,
      problemLabel: requestData.problemLabel,
      description: requestData.description,
      urgency: requestData.urgency,
      photoDataUrls: requestData.photoDataUrls,
      interventionAddress: requestData.interventionAddress,
      interventionLatLng: requestData.interventionLatLng,
    });
    resetRequestAfterSubmit();

    const formattedCode = formatPortalAccessCode(portalFields.portalAccessCode);
    setLastSubmittedPortalAccessCode(formattedCode);

    void notifyRequesterPortalAccess({
      interventionId: newDocRef.id,
      clientEmailRaw,
      user,
    });

    if (profile.type === "particulier") {
      toast.success(String(t("requester.toasts.request_saved_portal_title")), {
        description: String(t("requester.toasts.request_saved_portal_desc")).replace(
          "{{code}}",
          formattedCode
        ),
        duration: 12_000,
      });
    } else {
      toast.success(String(t("requester.toasts.request_saved")));
    }

    triggerRequesterMobileHaptic("medium");
    onFocusMobileRail?.("right");
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    const errCode =
      e && typeof e === "object" && "code" in e ? String((e as { code?: string }).code) : "";
    logger.error("useRequesterInterventionForm submit", { error: errMsg, code: errCode });
    toast.error(String(t("requester.toasts.send_failed")), {
      description: errCode ? `${errCode} — ${errMsg}` : errMsg,
      duration: 12_000,
    });
  } finally {
    setIsSubmitting(false);
  }
}
