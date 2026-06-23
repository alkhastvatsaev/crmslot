"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { useBackofficeInboxIntentOptional } from "@/context/BackofficeInboxIntentContext";
import { useDashboardPagerOptional } from "@/features/dashboard";
import { resolveClientPortalInterventionCompanyId } from "@/features/company/clientPortalCompanyId";
import { useTranslation } from "@/core/i18n/I18nContext";
import { compressImageToDataUrl } from "@/features/interventions/compressImageToDataUrl";
import { REQUESTER_GEOLOC_ADDRESS_PENDING } from "@/features/interventions/smartInterventionConstants";
import { SMART_FORM_MAX_PHOTOS } from "@/features/interventions/hooks/useSmartForm";
import { resolveInterventionAddressFromCoords } from "@/features/interventions/smartFormReverseGeocode";
import { uploadInterventionAudioToFirebase } from "@/features/interventions/clientAudioUpload";
import { useRequesterHub } from "@/context/RequesterHubContext";
import { REQUESTER_GEOLOC_OPTIONS } from "@/features/interventions/requesterInterventionFormHelpers";
import { submitRequesterIntervention } from "@/features/interventions/requesterInterventionFormSubmit";
import { logger } from "@/core/logger";

export function useRequesterInterventionForm() {
  const {
    profile,
    requestData,
    isSubmitting,
    setIsSubmitting,
    setLastSubmittedRequest,
    setLastSubmittedInterventionId,
    setLastSubmittedPortalAccessCode,
    setPortalRightTab,
    setPendingTrackingInterventionId,
    clientAccountFields,
    resetRequestAfterSubmit,
    triggerValidation,
    setRequestData,
  } = useRequesterHub();

  const workspace = useCompanyWorkspaceOptional();
  const inboxIntent = useBackofficeInboxIntentOptional();
  const pager = useDashboardPagerOptional();
  const { t, language } = useTranslation();
  const locale = language === "nl" ? "nl-BE" : language === "en" ? "en-GB" : "fr-BE";
  const [locatingAddress, setLocatingAddress] = useState(false);

  const tenantCompanyId =
    workspace?.isTenantUser && workspace.activeCompanyId ? workspace.activeCompanyId : null;
  const interventionCompanyId = resolveClientPortalInterventionCompanyId({
    tenantActiveCompanyId: tenantCompanyId,
  });

  const { interventionAddress, problemLabel, description } = requestData;

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

        toast.error(String(t("requester.toasts.voice_save_failed_title")), {
          description: String(t("requester.toasts.voice_save_failed_desc")),
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
      REQUESTER_GEOLOC_OPTIONS
    );
  }, [setRequestData, t]);

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

  const canSubmit =
    interventionAddress.trim() &&
    interventionAddress !== REQUESTER_GEOLOC_ADDRESS_PENDING &&
    (problemLabel.trim() || description.trim()) &&
    !isSubmitting;

  const handleSubmit = () =>
    void submitRequesterIntervention({
      profile,
      clientAccountFields,
      requestData,
      tenantCompanyId,
      interventionCompanyId,
      isTenantUser: Boolean(workspace?.isTenantUser),
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
      onInboxPendingId: inboxIntent ? (id) => inboxIntent.setPendingInboxId(id) : undefined,
      onNavigateMap: pager ? () => pager.setPageIndex(0) : undefined,
    });

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
