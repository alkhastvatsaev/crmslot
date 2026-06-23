import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import { toast } from "sonner";
import { collection, deleteDoc, doc, getDocs, query, setDoc, where } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { clientPortalAuth, firestore, storage } from "@/core/config/firebase";
import { logger } from "@/core/logger";
import type { ClientPortalAccountFields } from "@/features/auth/clientPortalAccountProfile";
import {
  resolveAccountFieldsForSubmit,
  validateClientPortalAccountFields,
} from "@/features/auth/clientPortalAccountProfile";
import { logCrmInterventionCreated } from "@/features/crmHistory/logCrmInterventionCreated";
import { findPotentialDuplicates } from "@/features/interventions/detectDuplicates";
import {
  isPersistableClientAudioUrl,
  uploadInterventionAudioToFirebase,
} from "@/features/interventions/clientAudioUpload";
import type {
  InterventionRequestData,
  RequesterProfile,
} from "@/features/interventions/context/RequesterHubContext";
import { ensureRequesterUserForSubmit } from "@/features/interventions/requesterInterventionFormHelpers";
import { recordDuplicateAlertIfNeeded } from "@/features/interventions/recordDuplicateAlertIfNeeded";
import { REQUESTER_GEOLOC_ADDRESS_PENDING } from "@/features/interventions/smartInterventionConstants";
import { SMART_FORM_MAX_PHOTOS } from "@/features/interventions/hooks/useSmartForm";
import type { Intervention } from "@/features/interventions/types";
import { isValidPortalEmail, normalizePortalEmail } from "@/features/interventions/portalEmail";
import { capitalizeName } from "@/utils/stringUtils";

export type RequesterInterventionSubmitInput = {
  profile: RequesterProfile;
  clientAccountFields: ClientPortalAccountFields | null;
  requestData: InterventionRequestData;
  tenantCompanyId: string | null;
  interventionCompanyId: string | null;
  isTenantUser: boolean;
  locale: string;
  t: (key: string) => string;
  triggerValidation: () => void;
  setIsSubmitting: (v: boolean) => void;
  setLastSubmittedInterventionId: (id: string) => void;
  setPendingTrackingInterventionId: (id: string | null) => void;
  setPortalRightTab: (
    tab: "tracking" | "chat" | "invoice" | "documents" | "timeline" | null
  ) => void;
  setLastSubmittedRequest: (request: InterventionRequestData | null) => void;
  resetRequestAfterSubmit: () => void;
  setLastSubmittedPortalAccessCode: (code: string) => void;
  onInboxPendingId?: (id: string) => void;
  onNavigateMap?: () => void;
};

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
  } = input;

  const {
    problemTemplateId,
    problemLabel,
    description,
    urgency,
    photoDataUrls,
    interventionAddress,
    interventionLatLng,
    interventionDate,
    interventionTime,
    audioBlob,
  } = requestData;

  if (profile.type !== "particulier") {
    const u = clientPortalAuth?.currentUser;
    if (!u || u.isAnonymous || !u.emailVerified) {
      triggerValidation();
      toast.error(String(t("requester.toasts.fill_left_panel")));
      return;
    }

    const accountFields = resolveAccountFieldsForSubmit(clientAccountFields, profile, u.email);
    if (validateClientPortalAccountFields(accountFields).length > 0) {
      triggerValidation();
      toast.error(String(t("requester.toasts.fill_account_profile")));
      return;
    }
  } else {
    const missingProfileFields: string[] = [];
    if (!profile.firstName.trim()) missingProfileFields.push("firstName");
    if (!profile.lastName.trim()) missingProfileFields.push("lastName");
    if (!profile.phone.trim()) missingProfileFields.push("phone");
    if (!profile.email.trim()) missingProfileFields.push("email");

    if (missingProfileFields.length > 0) {
      triggerValidation();
      toast.error(String(t("requester.toasts.fill_left_panel")));
      return;
    }

    if (!isValidPortalEmail(profile.email)) {
      triggerValidation();
      toast.error(String(t("requester.toasts.email_invalid")));
      return;
    }
  }

  if (!interventionAddress.trim()) {
    toast.error(String(t("requester.toasts.address_required")));
    return;
  }
  if (interventionAddress === REQUESTER_GEOLOC_ADDRESS_PENDING) {
    toast.error(String(t("requester.toasts.address_searching")));
    return;
  }
  if (!problemLabel.trim() && !description.trim()) {
    toast.error(String(t("requester.toasts.problem_required")));
    return;
  }
  if (isTenantUser && !tenantCompanyId) {
    toast.error(String(t("requester.toasts.company_required")));
    return;
  }
  if (!interventionCompanyId) {
    toast.error(String(t("requester.toasts.company_required")));
    return;
  }

  setIsSubmitting(true);
  try {
    const user = await ensureRequesterUserForSubmit(profile.type);
    if (!user || !firestore) {
      toast.error(String(t("requester.toasts.auth_failed")));
      return;
    }

    const problemForDedupe = description.trim() || problemLabel.trim();
    const qDup = tenantCompanyId
      ? query(
          collection(firestore, "interventions"),
          where("companyId", "==", interventionCompanyId)
        )
      : query(collection(firestore, "interventions"), where("createdByUid", "==", user.uid));
    const snapDup = await getDocs(qDup);
    const existing = snapDup.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as unknown as Intervention[];
    const matches = findPotentialDuplicates(
      {
        address: interventionAddress.trim(),
        problem: problemForDedupe,
        client: {
          firstName: profile.firstName.trim(),
          lastName: profile.lastName.trim(),
          phone: profile.phone.trim(),
          email: profile.email.trim(),
        },
      },
      existing,
      0.95
    );

    if (matches.length > 0) {
      toast.error("VOTRE ENTREPRISE A DEJA FAIT CETTE DEMANDE", {
        description: "Une demande identique a déjà été soumise.",
      });
      setIsSubmitting(false);
      return;
    }

    let audioUrlForDoc = (requestData.audioUrl ?? "").trim() || null;
    if (!isPersistableClientAudioUrl(audioUrlForDoc)) {
      audioUrlForDoc = null;
    }
    const blobForAudio = requestData.audioBlob;
    if (blobForAudio && blobForAudio.size > 0 && !audioUrlForDoc) {
      try {
        const quick = await uploadInterventionAudioToFirebase(blobForAudio);
        if (quick?.url) {
          audioUrlForDoc = quick.url;
        }
      } catch (e) {
        logger.error("Persist vocal at submit failed", {
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }

    const db = firestore;
    const newDocRef = doc(collection(db, "interventions"));
    setLastSubmittedInterventionId(newDocRef.id);
    setPendingTrackingInterventionId(newDocRef.id);
    setPortalRightTab("tracking");
    const title = (problemLabel.trim() || description.trim()).slice(0, 140);
    const nowIso = new Date().toISOString();
    const hour =
      interventionTime ||
      new Date().toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });

    let lat = interventionLatLng?.lat;
    let lng = interventionLatLng?.lng;
    if (lat === undefined || lng === undefined) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      try {
        const geo = await fetchWithAuth(
          `/api/maps/geocode?q=${encodeURIComponent(interventionAddress.trim())}`,
          { signal: controller.signal }
        );
        const gj = (await geo.json()) as { location?: { lat: number; lng: number } };
        lat = gj.location?.lat ?? 50.8466;
        lng = gj.location?.lng ?? 4.3522;
      } catch {
        lat = 50.8466;
        lng = 4.3522;
      } finally {
        clearTimeout(timeoutId);
      }
    }

    const portalUser =
      (profile.type === "login" || profile.type === "register") &&
      clientPortalAuth?.currentUser &&
      !clientPortalAuth.currentUser.isAnonymous
        ? clientPortalAuth.currentUser
        : null;
    let clientFirstRaw = profile.firstName.trim();
    let clientLastRaw = profile.lastName.trim();
    if (portalUser && !clientFirstRaw && !clientLastRaw && portalUser.displayName?.trim()) {
      const parts = portalUser.displayName.trim().split(/\s+/);
      clientFirstRaw = parts[0] ?? "";
      clientLastRaw = parts.slice(1).join(" ");
    }
    const clientPhoneRaw = profile.phone.trim() || (portalUser?.phoneNumber ?? "").trim();
    const clientEmailRaw =
      profile.email.trim() ||
      clientAccountFields?.email.trim() ||
      (portalUser?.email ?? user.email ?? "").trim();

    const { portalAccessFields } = await import("@/features/interventions/ensurePortalAccessToken");
    const { formatPortalAccessCode } = await import("@/features/interventions/portalAccessCode");
    const portalFields = portalAccessFields();

    await setDoc(newDocRef, {
      title,
      address: interventionAddress.trim(),
      time: hour,
      status: "pending",
      location: { lat, lng },
      urgency,
      problem: problemForDedupe,
      category: "serrurerie",
      createdAt: nowIso,
      createdByUid: user.uid,
      assignedTechnicianUid: null,
      companyId: interventionCompanyId,
      ...portalFields,
      ...(photoDataUrls.length
        ? { attachmentThumbnails: photoDataUrls.slice(0, SMART_FORM_MAX_PHOTOS) }
        : {}),
      ...(clientFirstRaw ? { clientFirstName: capitalizeName(clientFirstRaw) } : {}),
      ...(clientLastRaw ? { clientLastName: capitalizeName(clientLastRaw) } : {}),
      ...(clientPhoneRaw ? { clientPhone: clientPhoneRaw } : {}),
      ...(clientEmailRaw ? { clientEmail: clientEmailRaw } : {}),
      ...(clientEmailRaw ? { clientEmailNormalized: normalizePortalEmail(clientEmailRaw) } : {}),
      ...(interventionDate ? { requestedDate: interventionDate } : {}),
      ...(interventionTime ? { requestedTime: interventionTime } : {}),
      ...(audioUrlForDoc && isPersistableClientAudioUrl(audioUrlForDoc)
        ? { audioUrl: audioUrlForDoc }
        : {}),
    });

    void logCrmInterventionCreated({
      intervention: {
        id: newDocRef.id,
        title,
        address: interventionAddress.trim(),
        status: "pending",
        companyId: interventionCompanyId,
        ...(clientFirstRaw ? { clientFirstName: capitalizeName(clientFirstRaw) } : {}),
        ...(clientLastRaw ? { clientLastName: capitalizeName(clientLastRaw) } : {}),
      },
      actorUid: user.uid,
      actorRole: "client",
      source: "hub_requester_panel",
    });

    void (async () => {
      try {
        if (audioBlob && audioBlob.size > 0) {
          const mime = audioBlob.type || "audio/webm";
          const ext = mime.includes("mp4") ? "m4a" : "webm";

          if (storage) {
            try {
              const storagePath = `interventions_audio/${user.uid}/${Date.now()}.${ext}`;
              const audioRef = ref(storage, storagePath);
              await uploadBytes(audioRef, audioBlob);
              const firebaseAudioUrl = await getDownloadURL(audioRef);

              await setDoc(
                newDocRef,
                {
                  audioUrl: firebaseAudioUrl,
                  audioStoragePath: storagePath,
                  audioMimeType: mime,
                },
                { merge: true }
              );
            } catch (err) {
              logger.error("Audio upload failed (Storage)", {
                error: err instanceof Error ? err.message : String(err),
              });
            }
          }
        }

        recordDuplicateAlertIfNeeded({
          db,
          newInterventionId: newDocRef.id,
          companyId: interventionCompanyId,
          address: interventionAddress.trim(),
          problem: problemForDedupe,
          createdByUid: user.uid,
          client: {
            firstName: clientFirstRaw,
            lastName: clientLastRaw,
            phone: clientPhoneRaw,
            email: profile.email.trim(),
          },
        }).catch(() => null);

        deleteDoc(doc(db, "intervention_request_drafts", user.uid)).catch(() => null);
      } catch (bgErr) {
        logger.error("Background submission error:", {
          error: bgErr instanceof Error ? bgErr.message : String(bgErr),
        });
      }
    })();

    onInboxPendingId?.(newDocRef.id);
    onNavigateMap?.();

    setLastSubmittedRequest({
      problemTemplateId,
      problemLabel,
      description,
      urgency,
      photoDataUrls,
      interventionAddress,
      interventionLatLng,
    });
    resetRequestAfterSubmit();

    const formattedCode = formatPortalAccessCode(portalFields.portalAccessCode);
    setLastSubmittedPortalAccessCode(formattedCode);
    const notifyPortalAccess = async () => {
      if (!clientEmailRaw) return;
      try {
        const res = await fetchWithAuth(
          `/api/interventions/${newDocRef.id}/portal-access-notify`,
          { method: "POST" },
          { user }
        );
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
          emailSent?: boolean;
        };
        if (!res.ok) {
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
        if (body.emailSent === false) {
          logger.warn("Portal access welcome email not sent", {
            interventionId: newDocRef.id,
            to: clientEmailRaw,
          });
        }
      } catch (notifyError) {
        logger.warn("Portal access notify failed", {
          error: notifyError instanceof Error ? notifyError.message : String(notifyError),
        });
      }
    };

    if (profile.type === "particulier") {
      void notifyPortalAccess();
      toast.success(String(t("requester.toasts.request_saved_portal_title")), {
        description: String(t("requester.toasts.request_saved_portal_desc")).replace(
          "{{code}}",
          formattedCode
        ),
        duration: 12_000,
      });
    } else {
      void notifyPortalAccess();
      toast.success(String(t("requester.toasts.request_saved")));
    }
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
