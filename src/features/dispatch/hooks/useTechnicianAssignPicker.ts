"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { pickRecommendedSlot } from "@/features/scheduling/pickRecommendedSlot";
import type { Intervention } from "@/features/interventions";
import { interventionLocationOrDefault } from "@/features/interventions/interventionLocation";
import {
  buildAssignInterventionToTechnicianUpdate,
  type AssignScheduleOverride,
} from "@/features/interventions/assignInterventionToTechnician";
import { proposeAvailableSlotsForTechnician } from "@/features/scheduling/proposeAvailableSlots";
import { initialAssignmentDateYmd } from "@/features/scheduling/resolveSmartAssignmentSchedule";
import {
  prioritizeDefaultAssignTechnician,
  rankTechniciansForIntervention,
} from "@/features/dispatch/rankTechniciansForIntervention";
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

export type UseTechnicianAssignPickerParams = {
  intervention: Pick<
    Intervention,
    | "id"
    | "location"
    | "address"
    | "problem"
    | "requestedDate"
    | "requestedTime"
    | "scheduledDate"
    | "scheduledTime"
  >;
  peerInterventions?: Intervention[];
  allInterventions?: Intervention[];
  onAssign: (technicianUid: string, schedule?: AssignScheduleOverride) => void | Promise<void>;
  isAssigning?: boolean;
  techniciansOnly?: boolean;
  t: (key: string) => string;
};

export function useTechnicianAssignPicker({
  intervention,
  peerInterventions = [],
  allInterventions,
  onAssign,
  isAssigning = false,
  techniciansOnly = false,
  t,
}: UseTechnicianAssignPickerParams) {
  const { technicians, loading } = useTechnicians();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [etaLoading, setEtaLoading] = useState(false);
  const [recommendedId, setRecommendedId] = useState<string | null>(null);
  const [aiReasoning, setAiReasoning] = useState<string | null>(null);
  const [aiRevenueImpact, setAiRevenueImpact] = useState<string | null>(null);
  const [etaByTechId, setEtaByTechId] = useState<Record<string, string>>({});
  const [scheduleDate, setScheduleDate] = useState(() =>
    initialAssignmentDateYmd(intervention, new Date())
  );
  const [selectedSlotTime, setSelectedSlotTime] = useState<string | null>(null);

  const interventionCoords = useMemo(
    () => interventionLocationOrDefault(intervention),
    [intervention]
  );

  const ranked = useMemo(
    () =>
      prioritizeDefaultAssignTechnician(
        rankTechniciansForIntervention(technicians, interventionCoords.lat, interventionCoords.lng)
      ),
    [technicians, interventionCoords.lat, interventionCoords.lng]
  );

  useEffect(() => {
    if (ranked.length === 0) return;
    Promise.resolve().then(() => {
      setSelectedId((prev) => prev ?? ranked[0]!.technician.id);
    });
  }, [ranked]);

  const techniciansRef = useRef(technicians);
  techniciansRef.current = technicians;
  const rankedLengthRef = useRef(ranked.length);
  rankedLengthRef.current = ranked.length;

  useEffect(() => {
    let cancelled = false;
    if (rankedLengthRef.current === 0) return;

    const calculateBest = async () => {
      setEtaLoading(true);
      try {
        const result = await findBestTechnician(
          techniciansRef.current,
          interventionCoords.lat,
          interventionCoords.lng,
          intervention.problem,
          intervention.address,
          null,
          allInterventions ?? null
        );
        if (cancelled || !result) return;
        const best = result.technician;
        setRecommendedId(best.id);
        if (result.reasoning) setAiReasoning(result.reasoning);
        if (result.revenueImpact) setAiRevenueImpact(result.revenueImpact);
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
    // technicians/ranked are accessed via ref — only re-run on stable intervention identity
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interventionCoords.lat, interventionCoords.lng, intervention.problem, intervention.address]);

  const scheduleOverride = useMemo((): AssignScheduleOverride | undefined => {
    if (techniciansOnly || !selectedSlotTime?.trim()) return undefined;
    return { scheduledDate: scheduleDate, scheduledTime: selectedSlotTime };
  }, [techniciansOnly, scheduleDate, selectedSlotTime]);

  const proposedSlots = useMemo(() => {
    if (techniciansOnly || !selectedId) return [];
    const tech = ranked.find((r) => r.technician.id === selectedId);
    if (!tech || !canResolveTechnicianAssignUid(tech.technician)) return [];
    return proposeAvailableSlotsForTechnician({
      interventions: peerInterventions,
      technicianUid: resolveTechnicianAssignUid(tech.technician),
      dateYmd: scheduleDate,
      excludeInterventionId: intervention.id,
    });
  }, [techniciansOnly, selectedId, ranked, peerInterventions, scheduleDate, intervention.id]);

  useEffect(() => {
    if (techniciansOnly || !selectedId || proposedSlots.length === 0) return;
    setSelectedSlotTime((prev) => {
      if (prev && proposedSlots.some((s) => s.time === prev)) return prev;
      return pickRecommendedSlot(
        proposedSlots,
        intervention.requestedTime ?? intervention.scheduledTime
      );
    });
  }, [
    techniciansOnly,
    selectedId,
    proposedSlots,
    intervention.requestedTime,
    intervention.scheduledTime,
  ]);

  const selectedConflicts = useMemo(() => {
    if (!selectedId) return [];
    const tech = ranked.find((r) => r.technician.id === selectedId);
    if (!tech || !canResolveTechnicianAssignUid(tech.technician)) return [];
    const uid = resolveTechnicianAssignUid(tech.technician);
    const patch = buildAssignInterventionToTechnicianUpdate(
      intervention,
      uid,
      new Date(),
      scheduleOverride
    );
    const range = candidateRangeFromScheduleFields(patch.scheduledDate, patch.scheduledTime);
    if (!range) return [];
    return findTechnicianScheduleConflicts({
      interventions: peerInterventions,
      technicianUid: uid,
      candidateRange: range,
      excludeInterventionId: intervention.id,
    });
  }, [selectedId, ranked, intervention, peerInterventions, scheduleOverride]);

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
    void onAssign(resolveTechnicianAssignUid(row.technician), scheduleOverride);
  };

  const handleScheduleDateChange = (date: string) => {
    setScheduleDate(date);
    setSelectedSlotTime(null);
  };

  const confirmDisabled =
    !selectedId || isAssigning || ranked.length === 0 || selectedConflicts.length > 0;

  return {
    loading,
    ranked,
    selectedId,
    setSelectedId,
    etaLoading,
    recommendedId,
    aiReasoning,
    aiRevenueImpact,
    etaByTechId,
    scheduleDate,
    selectedSlotTime,
    setSelectedSlotTime,
    scheduleOverride,
    proposedSlots,
    selectedConflicts,
    handleConfirm,
    handleScheduleDateChange,
    confirmDisabled,
  };
}
