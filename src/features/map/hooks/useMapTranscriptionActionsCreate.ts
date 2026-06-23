"use client";

import { useCallback, type Dispatch, type SetStateAction } from "react";
import { logger } from "@/core/logger";
import { auth, firestore, isConfigured } from "@/core/config/firebase";
import { addDoc, collection } from "firebase/firestore";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { recordDuplicateAlertIfNeeded } from "@/features/interventions/recordDuplicateAlertIfNeeded";
import { logCrmInterventionCreated } from "@/features/crmHistory/logCrmInterventionCreated";
import { useTranslation } from "@/core/i18n/I18nContext";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import { requestAutoAssignIntervention } from "@/features/interventions/requestAutoAssignIntervention";
import { toast } from "sonner";
import {
  formatMapTranscriptionClientName,
  normalizeMapTranscriptionTime,
  type MapTranscriptionCreatedMission,
  type MapTranscriptionFormState,
  type MapTranscriptionLatestAudioResponse,
} from "@/features/map/mapTranscriptionActionsTypes";

type UseMapTranscriptionActionsCreateOptions = {
  fileName: string | null;
  form: MapTranscriptionFormState;
  latest: MapTranscriptionLatestAudioResponse | null;
  setLatest: Dispatch<SetStateAction<MapTranscriptionLatestAudioResponse | null>>;
  setEditOpen: (open: boolean) => void;
  setBusy: (busy: null | "refuse" | "create") => void;
  onInterventionCreated?: (mission: MapTranscriptionCreatedMission) => void;
  onVoiceReviewComplete?: () => void;
};

export function useMapTranscriptionActionsCreate({
  fileName,
  form,
  latest,
  setLatest,
  setEditOpen,
  setBusy,
  onInterventionCreated,
  onVoiceReviewComplete,
}: UseMapTranscriptionActionsCreateOptions) {
  const { t } = useTranslation();
  const workspace = useCompanyWorkspaceOptional();

  const notifyAutoAssign = useCallback(
    async (interventionId: string) => {
      const result = await requestAutoAssignIntervention(interventionId);
      if (result.assigned && result.technicianName) {
        toast.success(String(t("dispatch.auto_assign_ok")), {
          description: String(t("dispatch.auto_assign_desc")).replace(
            "{{name}}",
            result.technicianName ?? ""
          ),
        });
      }
    },
    [t]
  );

  const supprimer = useCallback(async () => {
    if (!fileName) {
      setEditOpen(false);
      return;
    }
    setBusy("refuse");
    try {
      await fetchWithAuth("/api/ai/audio-decision", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fileName, status: "refused" }),
      }).catch(() => null);
      setLatest((prev) =>
        prev
          ? { ...prev, decision: { status: "refused", updatedAt: new Date().toISOString() } }
          : prev
      );
      setEditOpen(false);
      onVoiceReviewComplete?.();
    } finally {
      setBusy(null);
    }
  }, [fileName, setEditOpen, setLatest, setBusy, onVoiceReviewComplete]);

  const create = useCallback(async () => {
    if (!fileName) return;
    setBusy("create");
    try {
      const tenantCompanyId =
        workspace?.isTenantUser && workspace.activeCompanyId
          ? workspace.activeCompanyId
          : undefined;
      const interventionCompanyId = tenantCompanyId;
      const res = await fetchWithAuth("/api/interventions/from-audio", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fileName,
          override: form,
          ...(interventionCompanyId ? { companyId: interventionCompanyId } : {}),
        }),
      });
      if (res.ok) {
        const payload = (await res.json().catch(() => null)) as {
          interventionId?: string | null;
          intervention?: {
            clientName?: string | null;
            title?: string;
            status?: string;
            location?: { lat: number; lng: number };
          };
        } | null;
        const loc = payload?.intervention?.location;
        if (loc && typeof loc.lat === "number" && typeof loc.lng === "number") {
          onInterventionCreated?.({
            id: Date.now(),
            key: fileName,
            clientName: formatMapTranscriptionClientName(
              form.clientName || payload?.intervention?.clientName || "Client"
            ),
            coordinates: [loc.lng, loc.lat],
            time: normalizeMapTranscriptionTime(form.time),
            status: payload?.intervention?.status || "À venir",
            source: "live",
            date: form.date.trim(),
          });
        }
        if (payload?.interventionId) {
          void notifyAutoAssign(payload.interventionId);
        }
        setLatest((prev) =>
          prev
            ? { ...prev, decision: { status: "created", updatedAt: new Date().toISOString() } }
            : prev
        );
        setEditOpen(false);
        onVoiceReviewComplete?.();
        return;
      }

      {
        const sidecar = latest?.audio?.meta;
        if (!sidecar || !sidecar.analysis || !isConfigured || !firestore) {
          throw new Error("Erreur création intervention");
        }

        const analysis = sidecar.analysis;
        const address = form.address.trim() || analysis.adresse?.trim() || null;
        const nowIso = new Date().toISOString();
        const uid = auth?.currentUser?.uid ?? null;
        const fallbackTenantCompanyId = interventionCompanyId;
        const dStr = form.date.trim();
        const tStr = form.time.trim();
        const scheduleFromForm =
          dStr && /^\d{4}-\d{2}-\d{2}$/.test(dStr) && tStr && /^\d{1,2}:\d{2}$/.test(tStr)
            ? { scheduledDate: dStr, scheduledTime: tStr.slice(0, 5) }
            : {};
        const doc = {
          title: (
            form.problem.trim() ||
            analysis.probleme?.trim() ||
            "Intervention serrurerie"
          ).slice(0, 140),
          address: address ?? "Adresse inconnue",
          time: form.time.trim(),
          status: address ? "pending" : "pending_needs_address",
          location: { lat: 50.8466, lng: 4.3522 },
          phone: form.phone.trim() || sidecar.phone || null,
          clientName: formatMapTranscriptionClientName(form.clientName.trim()) || null,
          urgency: Boolean(form.urgency),
          category: analysis.est_serrurerie ? ("serrurerie" as const) : ("autre" as const),
          problem: form.problem.trim() || analysis.probleme?.trim() || null,
          date: dStr || null,
          hour: tStr || null,
          transcription: analysis.transcription?.trim() || "",
          audioUrl: sidecar.publicUrl,
          createdAt: nowIso,
          createdByUid: uid,
          assignedTechnicianUid: null,
          ...scheduleFromForm,
          ...(fallbackTenantCompanyId ? { companyId: fallbackTenantCompanyId } : {}),
          ...(uid ? { createdByUid: uid } : {}),
        };

        const { portalAccessTokenField } =
          await import("@/features/interventions/ensurePortalAccessToken");
        const createdRef = await addDoc(collection(firestore, "interventions"), {
          ...doc,
          ...portalAccessTokenField(),
        });
        if (fallbackTenantCompanyId) {
          void logCrmInterventionCreated({
            intervention: {
              id: createdRef.id,
              title: doc.title,
              address: doc.address,
              status: doc.status as import("@/features/interventions/types").Intervention["status"],
              companyId: fallbackTenantCompanyId,
              clientName: doc.clientName ?? undefined,
            },
            actorUid: uid || "system",
            actorRole: "dispatcher",
            source: "map_transcription",
          });
        }
        if (uid) {
          await recordDuplicateAlertIfNeeded({
            db: firestore,
            newInterventionId: createdRef.id,
            companyId: fallbackTenantCompanyId ?? null,
            address: doc.address,
            problem: (doc.problem ?? doc.title ?? "").trim(),
            createdByUid: uid,
          }).catch(() => null);
        }
        onInterventionCreated?.({
          id: Date.now(),
          key: fileName,
          clientName: doc.clientName || doc.title,
          coordinates: [doc.location.lng, doc.location.lat],
          time: normalizeMapTranscriptionTime(doc.time),
          status: "À venir",
          source: "live",
          date: form.date.trim(),
        });
        void notifyAutoAssign(createdRef.id);
        await fetchWithAuth("/api/ai/audio-decision", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ fileName, status: "created" }),
        }).catch(() => null);
      }
      setLatest((prev) =>
        prev
          ? { ...prev, decision: { status: "created", updatedAt: new Date().toISOString() } }
          : prev
      );
      setEditOpen(false);
      onVoiceReviewComplete?.();
    } catch (e) {
      logger.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }, [
    fileName,
    latest,
    form,
    notifyAutoAssign,
    onInterventionCreated,
    workspace,
    setLatest,
    setEditOpen,
    setBusy,
    onVoiceReviewComplete,
  ]);

  return { supprimer, create };
}
