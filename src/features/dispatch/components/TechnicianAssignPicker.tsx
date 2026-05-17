"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, MapPin, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import type { Intervention } from "@/features/interventions/types";
import { buildAssignInterventionToTechnicianUpdate } from "@/features/interventions/assignInterventionToTechnician";
import { rankTechniciansForIntervention } from "@/features/dispatch/rankTechniciansForIntervention";
import ScheduleConflictBanner from "@/features/scheduling/components/ScheduleConflictBanner";
import {
  candidateRangeFromScheduleFields,
  findTechnicianScheduleConflicts,
} from "@/features/scheduling/scheduleConflicts";
import {
  canResolveTechnicianAssignUid,
  resolveTechnicianAssignUid,
} from "@/features/dispatch/technicianAssignUid";
import { toast } from "sonner";
import { findBestTechnician } from "@/features/dispatch/algorithm";
import { useTechnicians } from "@/features/technicians/hooks";
import type { Technician } from "@/features/technicians/types";

type Props = {
  intervention: Pick<
    Intervention,
    | "id"
    | "location"
    | "address"
    | "requestedDate"
    | "requestedTime"
    | "scheduledDate"
    | "scheduledTime"
  >;
  peerInterventions?: Intervention[];
  onAssign: (technicianUid: string) => void | Promise<void>;
  onCancel: () => void;
  isAssigning?: boolean;
};

function formatDistanceKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

const statusLabelKey: Record<Technician["status"], string> = {
  available: "dispatch.assign_picker.status_available",
  en_route: "dispatch.assign_picker.status_en_route",
  on_site: "dispatch.assign_picker.status_on_site",
};

export default function TechnicianAssignPicker({
  intervention,
  peerInterventions = [],
  onAssign,
  onCancel,
  isAssigning = false,
}: Props) {
  const { t } = useTranslation();
  const { technicians, loading } = useTechnicians();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [etaLoading, setEtaLoading] = useState(false);
  const [recommendedId, setRecommendedId] = useState<string | null>(null);
  const [etaByTechId, setEtaByTechId] = useState<Record<string, string>>({});

  const ranked = useMemo(
    () =>
      rankTechniciansForIntervention(
        technicians,
        intervention.location.lat,
        intervention.location.lng,
      ),
    [technicians, intervention.location.lat, intervention.location.lng],
  );

  useEffect(() => {
    if (ranked.length === 0) return;
    Promise.resolve().then(() => {
      setSelectedId((prev) => prev ?? ranked[0]!.technician.id);
    });
  }, [ranked]);

  useEffect(() => {
    let cancelled = false;
    if (!intervention.location.lat || ranked.length === 0) return;

    const calculateBest = async () => {
      setEtaLoading(true);
      try {
        const best = await findBestTechnician(
          technicians,
          intervention.location.lat,
          intervention.location.lng,
        );
        if (cancelled || !best) return;
        setRecommendedId(best.id);
        if (best.realEta) {
          setEtaByTechId((prev) => ({ ...prev, [best.id]: best.realEta! }));
        }
        setSelectedId((prev) => prev ?? best.id);
      } finally {
        if (!cancelled) setEtaLoading(false);
      }
    };

    void calculateBest();

    return () => {
      cancelled = true;
    };
  }, [intervention.location.lat, intervention.location.lng, technicians, ranked.length]);

  const selectedConflicts = useMemo(() => {
    if (!selectedId) return [];
    const tech = ranked.find((r) => r.technician.id === selectedId);
    if (!tech || !canResolveTechnicianAssignUid(tech.technician)) return [];
    const uid = resolveTechnicianAssignUid(tech.technician);
    const patch = buildAssignInterventionToTechnicianUpdate(intervention, uid);
    const range = candidateRangeFromScheduleFields(patch.scheduledDate, patch.scheduledTime);
    if (!range) return [];
    return findTechnicianScheduleConflicts({
      interventions: peerInterventions,
      technicianUid: uid,
      candidateRange: range,
      excludeInterventionId: intervention.id,
    });
  }, [selectedId, ranked, intervention, peerInterventions]);

  const handleConfirm = () => {
    const row = ranked.find((r) => r.technician.id === selectedId);
    if (!row || isAssigning) return;
    if (!canResolveTechnicianAssignUid(row.technician)) {
      toast.error(String(t("dispatch.assign_picker.missing_auth_uid")));
      return;
    }
    if (selectedConflicts.length > 0) {
      toast.error(String(t("scheduling.conflict.block_assign")));
      return;
    }
    void onAssign(resolveTechnicianAssignUid(row.technician));
  };

  return (
    <div
      data-testid="technician-assign-picker"
      className="rounded-[18px] border border-slate-200/80 bg-slate-50/90 p-4 shadow-[0_12px_32px_-16px_rgba(15,23,42,0.18)]"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {String(t("dispatch.assign_picker.title"))}
          </p>
          {intervention.address ? (
            <p className="mt-0.5 flex items-start gap-1 text-xs text-slate-500">
              <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
              <span className="line-clamp-2">{intervention.address}</span>
            </p>
          ) : null}
        </div>
        <button
          type="button"
          data-testid="technician-assign-picker-cancel"
          onClick={onCancel}
          className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label={String(t("dispatch.assign_picker.cancel"))}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-6 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          {String(t("dispatch.assign_picker.loading"))}
        </div>
      ) : ranked.length === 0 ? (
        <p className="py-4 text-center text-sm text-slate-500">
          {String(t("dispatch.assign_picker.no_technicians"))}
        </p>
      ) : (
        <>
        <ScheduleConflictBanner conflicts={selectedConflicts} className="mb-3" />
        <ul className="max-h-52 space-y-2 overflow-y-auto py-1">
          {ranked.map(({ technician, distanceKm }) => {
            const isSelected = selectedId === technician.id;
            const isRecommended = recommendedId === technician.id;
            const eta = etaByTechId[technician.id] ?? technician.realEta;

            return (
              <li key={technician.id}>
                <button
                  type="button"
                  data-testid={`technician-assign-option-${technician.id}`}
                  onClick={() => setSelectedId(technician.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-[14px] border px-3 py-2.5 text-left transition-colors",
                    isSelected
                      ? "border-slate-900 bg-slate-900/5 ring-1 ring-slate-900/20"
                      : "border-slate-100 bg-white hover:border-slate-200",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                      isSelected ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700",
                    )}
                  >
                    {technician.initial}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-semibold text-slate-900">{technician.name}</span>
                      {isRecommended ? (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
                          <Sparkles className="h-2.5 w-2.5" />
                          {String(t("dispatch.assign_picker.recommended"))}
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-0.5 flex flex-wrap gap-2 text-xs text-slate-500">
                      <span>{formatDistanceKm(distanceKm)}</span>
                      {eta ? <span>· ETA {eta}</span> : null}
                      <span>· {String(t(statusLabelKey[technician.status]))}</span>
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        </>
      )}

      <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
        <button
          type="button"
          data-testid="technician-assign-picker-cancel-footer"
          onClick={onCancel}
          className="flex-1 rounded-[12px] border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          {String(t("dispatch.assign_picker.cancel"))}
        </button>
        <button
          type="button"
          data-testid="technician-assign-confirm"
          disabled={!selectedId || isAssigning || ranked.length === 0 || selectedConflicts.length > 0}
          onClick={handleConfirm}
          className="flex flex-1 items-center justify-center gap-2 rounded-[12px] bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {isAssigning ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {String(t("dispatch.assign_picker.confirm"))}
          {etaLoading ? (
            <span className="sr-only">{String(t("dispatch.assign_picker.eta_loading"))}</span>
          ) : null}
        </button>
      </div>
    </div>
  );
}
