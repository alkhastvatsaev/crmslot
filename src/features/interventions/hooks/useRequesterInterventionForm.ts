"use client";

import { useCallback, useState } from "react";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import { toast } from "sonner";
import { collection, deleteDoc, doc, setDoc, query, where, getDocs } from "firebase/firestore";
import { signInAnonymously } from "firebase/auth";
import { auth, firestore, isConfigured, storage } from "@/core/config/firebase";
import { logger } from "@/core/logger";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { useBackofficeInboxIntentOptional } from "@/context/BackofficeInboxIntentContext";
import { useDashboardPagerOptional } from "@/features/dashboard/dashboardPagerContext";
import { DEMO_COMPANY_ID, devUiPreviewEnabled } from "@/core/config/devUiPreview";
import { useTranslation } from "@/core/i18n/I18nContext";
import { compressImageToDataUrl } from "@/features/interventions/compressImageToDataUrl";
import { REQUESTER_GEOLOC_ADDRESS_PENDING } from "@/features/interventions/smartInterventionConstants";
import { SMART_FORM_MAX_PHOTOS } from "@/features/interventions/hooks/useSmartForm";
import { recordDuplicateAlertIfNeeded } from "@/features/interventions/recordDuplicateAlertIfNeeded";
import { logCrmInterventionCreated } from "@/features/crmHistory/logCrmInterventionCreated";
import { findPotentialDuplicates } from "@/features/interventions/detectDuplicates";
import type { Intervention } from "@/features/interventions/types";
import { resolveInterventionAddressFromCoords } from "@/features/interventions/smartFormReverseGeocode";
import {
  allowDemoFilesystemAudio,
  isPersistableClientAudioUrl,
  uploadInterventionAudioToFirebase,
} from "@/features/interventions/clientAudioUpload";
import { capitalizeName } from "@/utils/stringUtils";
import { useRequesterHub } from "@/features/interventions/context/RequesterHubContext";

// ── Constants ─────────────────────────────────────────────────────────────────

const GEOLOC_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 8_000,
  maximumAge: 300_000,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  errorMsg: string = "Request timeout"
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(errorMsg)), ms);
    promise.then(
      (val) => {
        clearTimeout(timer);
        resolve(val);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

async function ensureUserForInterventionSubmit() {
  if (!isConfigured) return null;
  if (!auth) return null;
  if (auth.currentUser) return auth.currentUser;
  try {
    const cred = await withTimeout(signInAnonymously(auth), 10000, "Auth timeout");
    return cred.user;
  } catch (err) {
    logger.error("signInAnonymously error", {
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useRequesterInterventionForm() {
  const {
    profile,
    setProfile,
    requestData,
    setRequestData,
    isSubmitting,
    setIsSubmitting,
    setLastSubmittedRequest,
    setLastSubmittedInterventionId,
    setPortalRightTab,
    resetAll,
    triggerValidation,
  } = useRequesterHub();

  const workspace = useCompanyWorkspaceOptional();
  const inboxIntent = useBackofficeInboxIntentOptional();
  const pager = useDashboardPagerOptional();
  const { t, language } = useTranslation();
  const locale = language === "nl" ? "nl-BE" : language === "en" ? "en-GB" : "fr-BE";
  const [locatingAddress, setLocatingAddress] = useState(false);

  const portalDefaultCompanyId =
    typeof process.env.NEXT_PUBLIC_CLIENT_PORTAL_DEFAULT_COMPANY_ID === "string"
      ? process.env.NEXT_PUBLIC_CLIENT_PORTAL_DEFAULT_COMPANY_ID.trim()
      : "";
  const tenantCompanyId =
    workspace?.isTenantUser && workspace.activeCompanyId ? workspace.activeCompanyId : null;
  const interventionCompanyId =
    tenantCompanyId ??
    (portalDefaultCompanyId || null) ??
    (devUiPreviewEnabled ? DEMO_COMPANY_ID : null);

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

  // ── Audio recording ─────────────────────────────────────────────────────────

  const handleAudioRecorded = useCallback(
    async (blob: Blob) => {
      setRequestData((prev) => ({ ...prev, audioBlob: blob }));
      try {
        const firebaseSaved = await uploadInterventionAudioToFirebase(blob);
        if (firebaseSaved) {
          setRequestData((prev) => ({
            ...prev,
            audioUrl: firebaseSaved.url,
          }));
          toast.success(String(t("requester.intervention.audio_recorded_toast")), {
            description: String(t("requester.intervention.audio_saved_cloud_desc")),
          });
          return;
        }

        if (!allowDemoFilesystemAudio()) {
          toast.error(String(t("requester.toasts.voice_save_failed_title")), {
            description: String(t("requester.toasts.voice_save_failed_desc")),
          });
          return;
        }

        const formData = new FormData();
        const mime = blob.type || "audio/webm";
        const ext = mime.includes("mp4")
          ? "m4a"
          : mime.includes("ogg")
            ? "ogg"
            : mime.includes("wav")
              ? "wav"
              : "webm";
        formData.append("audio", blob, `message.${ext}`);

        const res = await fetchWithAuth("/api/demo/client-audio", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) throw new Error(String(t("requester.toasts.server_error")));

        const json = (await res.json().catch(() => null)) as {
          url?: string;
          storagePath?: string;
        } | null;
        const savedName =
          json?.url?.split("/").pop() || json?.storagePath?.split("/").pop() || `message.${ext}`;

        if (json?.url) {
          setRequestData((prev) => ({ ...prev, audioUrl: json.url ?? prev.audioUrl }));
        }

        toast.success(String(t("requester.intervention.audio_recorded_toast")), {
          description: savedName,
        });
      } catch (e) {
        logger.error("Échec de la sauvegarde audio", {
          error: e instanceof Error ? e.message : String(e),
        });
        toast.error(String(t("requester.toasts.voice_save_failed_title")), {
          description: String(t("requester.toasts.voice_save_failed_generic")),
        });
      }
    },
    [setRequestData, t]
  );

  // ── Geolocation ─────────────────────────────────────────────────────────────

  const fillAddressFromGeolocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error(String(t("requester.toasts.geoloc_unavailable")));
      return;
    }
    setLocatingAddress(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setRequestData((prev) => ({
          ...prev,
          interventionLatLng: { lat, lng },
          interventionAddress: REQUESTER_GEOLOC_ADDRESS_PENDING,
        }));
        try {
          const { formatted, location } = await resolveInterventionAddressFromCoords(lat, lng);
          setRequestData((prev) => ({
            ...prev,
            interventionLatLng: location,
            interventionAddress: formatted || "",
          }));
          if (!formatted) {
            toast.message(String(t("requester.toasts.position_saved")), {
              description: String(t("requester.toasts.complete_address_desc")),
            });
          }
        } catch {
          toast.error(String(t("requester.toasts.address_reverse_failed")));
          setRequestData((prev) => ({
            ...prev,
            interventionAddress:
              prev.interventionAddress === REQUESTER_GEOLOC_ADDRESS_PENDING
                ? ""
                : prev.interventionAddress,
          }));
        } finally {
          setLocatingAddress(false);
        }
      },
      () => {
        setLocatingAddress(false);
        toast.error(String(t("requester.toasts.location_denied")));
      },
      GEOLOC_OPTIONS
    );
  }, [setRequestData, t]);

  // ── Photos ───────────────────────────────────────────────────────────────────

  const ingestFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
      const max = SMART_FORM_MAX_PHOTOS;
      const encoded: string[] = [];
      for (const file of list) {
        if (encoded.length >= max) break;
        try {
          encoded.push(await compressImageToDataUrl(file));
        } catch {
          toast.error(String(t("requester.toasts.image_read_failed")));
        }
      }
      setRequestData((prev) => {
        const room = Math.max(0, max - prev.photoDataUrls.length);
        return { ...prev, photoDataUrls: [...prev.photoDataUrls, ...encoded.slice(0, room)] };
      });
    },
    [setRequestData, t]
  );

  const removePhoto = useCallback(
    (idx: number) => {
      setRequestData((prev) => ({
        ...prev,
        photoDataUrls: prev.photoDataUrls.filter((_, i) => i !== idx),
      }));
    },
    [setRequestData]
  );

  // ── Submit ────────────────────────────────────────────────────────────────────

  const canSubmit =
    interventionAddress.trim() &&
    interventionAddress !== REQUESTER_GEOLOC_ADDRESS_PENDING &&
    (problemLabel.trim() || description.trim()) &&
    !isSubmitting;

  const handleSubmit = async () => {
    if (profile.type === "login") {
      const u = auth?.currentUser;
      if (!u || u.isAnonymous) {
        setProfile((prev) => ({ ...prev, type: "particulier" }));
        triggerValidation();
        toast.error(String(t("requester.toasts.fill_left_panel")));
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
    if (workspace?.isTenantUser && !tenantCompanyId) {
      toast.error(String(t("requester.toasts.company_required")));
      return;
    }
    if (!interventionCompanyId) {
      toast.error(String(t("requester.toasts.company_required")));
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await ensureUserForInterventionSubmit();
      if (!user || !firestore) {
        toast.error(String(t("requester.toasts.auth_failed")));
        return;
      }

      // DUPLICATE CHECK BEFORE SUBMISSION
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
        { address: interventionAddress.trim(), problem: problemForDedupe },
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

      // Démo / filet de sécurité : l'URL peut arriver après le blob (fetch async dans handleAudioRecorded).
      let demoAudioUrlForDoc = (requestData.audioUrl ?? "").trim() || null;
      if (!isPersistableClientAudioUrl(demoAudioUrlForDoc)) {
        demoAudioUrlForDoc = null;
      }
      const blobForAudio = requestData.audioBlob;
      if (blobForAudio && blobForAudio.size > 0 && !demoAudioUrlForDoc) {
        try {
          const quick = await uploadInterventionAudioToFirebase(blobForAudio);
          if (quick?.url) {
            demoAudioUrlForDoc = quick.url;
          } else if (allowDemoFilesystemAudio()) {
            const formData = new FormData();
            const mime = blobForAudio.type || "audio/webm";
            const ext = mime.includes("mp4")
              ? "m4a"
              : mime.includes("ogg")
                ? "ogg"
                : mime.includes("wav")
                  ? "wav"
                  : "webm";
            formData.append("audio", blobForAudio, `message.${ext}`);
            const res = await fetchWithAuth("/api/demo/client-audio", {
              method: "POST",
              body: formData,
            });
            if (res.ok) {
              const json = (await res.json()) as { url?: string };
              demoAudioUrlForDoc = (json.url ?? "").trim() || null;
            }
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
      setPortalRightTab("invoice");
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
        profile.type === "login" && auth?.currentUser && !auth.currentUser.isAnonymous
          ? auth.currentUser
          : null;
      let clientFirstRaw = profile.firstName.trim();
      let clientLastRaw = profile.lastName.trim();
      if (portalUser && !clientFirstRaw && !clientLastRaw && portalUser.displayName?.trim()) {
        const parts = portalUser.displayName.trim().split(/\s+/);
        clientFirstRaw = parts[0] ?? "";
        clientLastRaw = parts.slice(1).join(" ");
      }
      const clientPhoneRaw = profile.phone.trim() || (portalUser?.phoneNumber ?? "").trim();

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
        ...(photoDataUrls.length
          ? { attachmentThumbnails: photoDataUrls.slice(0, SMART_FORM_MAX_PHOTOS) }
          : {}),
        ...(clientFirstRaw ? { clientFirstName: capitalizeName(clientFirstRaw) } : {}),
        ...(clientLastRaw ? { clientLastName: capitalizeName(clientLastRaw) } : {}),
        ...(clientPhoneRaw ? { clientPhone: clientPhoneRaw } : {}),
        ...(profile.email.trim() ? { clientEmail: profile.email.trim() } : {}),
        ...(interventionDate ? { requestedDate: interventionDate } : {}),
        ...(interventionTime ? { requestedTime: interventionTime } : {}),
        ...(demoAudioUrlForDoc && isPersistableClientAudioUrl(demoAudioUrlForDoc)
          ? { audioUrl: demoAudioUrlForDoc }
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

            const persistDemoFallback = async () => {
              if (!allowDemoFilesystemAudio()) return;
              try {
                const formData = new FormData();
                formData.append("audio", audioBlob, `message.${ext}`);
                const res = await fetchWithAuth("/api/demo/client-audio", {
                  method: "POST",
                  body: formData,
                });
                if (!res.ok) return;
                const json = (await res.json()) as { url?: string; mimeType?: string };
                if (json.url) {
                  await setDoc(
                    newDocRef,
                    {
                      audioUrl: json.url,
                      audioMimeType: json.mimeType ?? mime,
                    },
                    { merge: true }
                  );
                }
              } catch (e) {
                logger.error("Audio demo fallback failed", {
                  error: e instanceof Error ? e.message : String(e),
                });
              }
            };

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
                await persistDemoFallback();
              }
            } else {
              await persistDemoFallback();
            }
          }

          recordDuplicateAlertIfNeeded({
            db,
            newInterventionId: newDocRef.id,
            companyId: interventionCompanyId,
            address: interventionAddress.trim(),
            problem: problemForDedupe,
            createdByUid: user.uid,
          }).catch(() => null);

          deleteDoc(doc(db, "intervention_request_drafts", user.uid)).catch(() => null);
        } catch (bgErr) {
          logger.error("Background submission error:", {
            error: bgErr instanceof Error ? bgErr.message : String(bgErr),
          });
        }
      })();

      inboxIntent?.setPendingInboxId(newDocRef.id);
      pager?.setPageIndex(0);

      setLastSubmittedRequest({
        problemTemplateId,
        problemLabel,
        description,
        urgency,
        photoDataUrls,
        interventionAddress,
        interventionLatLng,
      });
      resetAll();
      toast.success(String(t("requester.toasts.request_saved")));
    } catch (e) {
      logger.error("useRequesterInterventionForm submit", {
        error: e instanceof Error ? e.message : String(e),
      });
      toast.error(String(t("requester.toasts.send_failed")));
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    tenantCompanyId,
    interventionCompanyId,
    locatingAddress,
    canSubmit,
    handleSubmit,
    handleAudioRecorded,
    fillAddressFromGeolocation,
    ingestFiles,
    removePhoto,
  };
}
