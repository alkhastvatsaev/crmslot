"use client";

import { logger } from "@/core/logger";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { auth, firestore, isConfigured } from "@/core/config/firebase";
import { addDoc, collection } from "firebase/firestore";
import {
  extractClientNameFromText,
  extractDateTimeFromText,
} from "@/features/map/components/transcriptionFormInference";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { recordDuplicateAlertIfNeeded } from "@/features/interventions/recordDuplicateAlertIfNeeded";
import { logCrmInterventionCreated } from "@/features/crmHistory/logCrmInterventionCreated";
import { useTranslation } from "@/core/i18n/I18nContext";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import { requestAutoAssignIntervention } from "@/features/interventions/requestAutoAssignIntervention";
import { toast } from "sonner";
import {
  EMPTY_MAP_TRANSCRIPTION_FORM,
  formatMapTranscriptionClientName,
  isMapTranscriptionFormValid,
  normalizeMapTranscriptionTime,
  type MapTranscriptionCreatedMission,
  type MapTranscriptionFormState,
  type MapTranscriptionLatestAudioResponse,
} from "@/features/map/mapTranscriptionActionsTypes";

export type MapTranscriptionActionsControllerOptions = {
  armed: boolean;
  onInterventionCreated?: (mission: MapTranscriptionCreatedMission) => void;
  /** Incrémenté à chaque appui sur Play pour ouvrir automatiquement le formulaire */
  openEditSignal?: number;
  /** Si défini : poller `/api/ai/audio-for-url` pour ce clip uniquement (aligné sur la file Galaxy). */
  scopedClipPublicUrl?: string | null;
};

export function useMapTranscriptionActionsController({
  armed,
  onInterventionCreated,
  openEditSignal = 0,
  scopedClipPublicUrl,
}: MapTranscriptionActionsControllerOptions) {
  const { t } = useTranslation();
  const workspace = useCompanyWorkspaceOptional();
  const [latest, setLatest] = useState<MapTranscriptionLatestAudioResponse | null>(null);
  const [busy, setBusy] = useState<null | "refuse" | "create">(null);
  const [editOpen, setEditOpen] = useState(false);
  /** Évite de rappeler openEdit() à chaque poll /latest-audio (sinon le formulaire efface la saisie). */
  const lastHandledOpenSignalRef = useRef(0);
  const [form, setForm] = useState<MapTranscriptionFormState>(EMPTY_MAP_TRANSCRIPTION_FORM);

  /** Aligne le panneau d’édition sur le rail gauche **visible** (évite les coords du pager hors écran). */
  const [railScreenRect, setRailScreenRect] = useState<{ left: number; width: number } | null>(
    null
  );

  useLayoutEffect(() => {
    if (!editOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRailScreenRect(null);
      return;
    }
    const read = () => {
      const el = document.getElementById("dashboard-left-rail");
      if (!el) {
        setRailScreenRect(null);
        return;
      }
      const r = el.getBoundingClientRect();
      if (r.width < 8 || r.right < 24 || r.left > window.innerWidth - 24) {
        setRailScreenRect(null);
        return;
      }
      const container = document.getElementById("dashboard-root-scroll");
      if (container) {
        const containerRect = container.getBoundingClientRect();
        const left = r.left - containerRect.left + container.scrollLeft;
        setRailScreenRect({ left, width: r.width });
      } else {
        setRailScreenRect({ left: r.left, width: r.width });
      }
    };
    read();
    const raf = window.requestAnimationFrame(read);
    const el = document.getElementById("dashboard-left-rail");
    const container = document.getElementById("dashboard-root-scroll");
    const ro = new ResizeObserver(read);
    if (el) ro.observe(el);
    if (container) {
      container.addEventListener("scroll", read);
    }
    window.addEventListener("resize", read);
    window.visualViewport?.addEventListener("resize", read);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      if (container) {
        container.removeEventListener("scroll", read);
      }
      window.removeEventListener("resize", read);
      window.visualViewport?.removeEventListener("resize", read);
    };
  }, [editOpen]);

  useEffect(() => {
    const s = scopedClipPublicUrl?.trim() ?? "";
    if (s) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLatest(null);
  }, [armed, scopedClipPublicUrl]);

  useEffect(() => {
    if (!armed) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLatest(null);
      setBusy(null);
      lastHandledOpenSignalRef.current = 0;
      return;
    }

    const useScoped = scopedClipPublicUrl !== undefined;
    const scoped = scopedClipPublicUrl?.trim() ?? "";

    let cancelled = false;

    const tick = async () => {
      try {
        if (useScoped && !scoped) return;
        const endpoint = useScoped
          ? `/api/ai/audio-for-url?url=${encodeURIComponent(scoped)}`
          : "/api/ai/latest-audio";
        const res = await fetchWithAuth(endpoint);
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as MapTranscriptionLatestAudioResponse;
        if (!cancelled) setLatest(data);
      } catch {
        /* ignore */
      }
    };

    void tick();
    const pollMs =
      Number(process.env.NEXT_PUBLIC_TRANSCRIPT_POLL_MS) > 0
        ? Number(process.env.NEXT_PUBLIC_TRANSCRIPT_POLL_MS)
        : 3000;
    const id = setInterval(tick, pollMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [armed, scopedClipPublicUrl]);

  const canShow =
    Boolean(armed) &&
    Boolean(latest?.audio?.transcript?.trim()) &&
    (latest?.decision?.status ?? "none") === "none";

  const fileName = latest?.audio?.name ?? null;

  const openEdit = useCallback(() => {
    const meta = latest?.audio?.meta;
    const analysis = meta?.analysis;
    const sourceText = analysis?.transcription || meta?.rawTranscript || "";
    const inferredName = extractClientNameFromText(sourceText);
    const inferred = extractDateTimeFromText(sourceText, meta?.receivedAt);
    setForm({
      address: analysis?.adresse?.trim() || "",
      clientName: inferredName,
      phone: typeof meta?.phone === "string" ? meta.phone : "",
      problem: analysis?.probleme?.trim() || "",
      urgency: Boolean(analysis?.urgence),
      date: inferred.date || "",
      time: inferred.time || "",
    });
    setEditOpen(true);
  }, [latest?.audio?.meta]);

  useEffect(() => {
    if (!armed) return;
    if (!openEditSignal || openEditSignal <= lastHandledOpenSignalRef.current) return;
    if (!canShow) return;
    lastHandledOpenSignalRef.current = openEditSignal;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    openEdit();
  }, [armed, openEditSignal, canShow, openEdit]);

  const isValid = isMapTranscriptionFormValid(form);

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
    } finally {
      setBusy(null);
    }
  }, [fileName]);

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
        return;
      }

      {
        // Fallback local (dev / bureau) quand Firebase Admin n'est pas configuré côté serveur.
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
        // Enregistrer la décision (Firestore admin si dispo, sinon disque côté serveur)
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
    } catch (e) {
      logger.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }, [fileName, latest, form, notifyAutoAssign, onInterventionCreated, workspace]);

  return {
    canShow,
    editOpen,
    railScreenRect,
    form,
    setForm,
    busy,
    isValid,
    supprimer,
    create,
  };
}
