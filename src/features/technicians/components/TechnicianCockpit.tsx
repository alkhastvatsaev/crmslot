import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import LeftPanel from "./LeftPanel";
import CenterPanel from "./CenterPanel";
import RightPanel from "./RightPanel";
import ARScanner from "./ARScanner";
import MissionFinishModal from "./MissionFinishModal";
import { MaterialOrderForm } from "@/features/materials/components/MaterialOrderForm";
import { BILLING_TEMPLATES } from "@/features/interventions/config/terrainTemplates";
import type { MaterialOrderPart } from "@/features/materials/types";

type TechnicianStatus = "available" | "on-mission" | "break";

interface Mission {
  id: string;
  client: string;
  type: string;
  address: string;
  eta: string;
  distance: string;
  phone?: string;
}

const mockMissions: Mission[] = [];

export default function TechnicianCockpit() {
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [techStatus, setTechStatus] = useState<TechnicianStatus>("available");
  const [activeMissionId, setActiveMissionId] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const missionStartRef = useRef<Date | null>(null);
  const [materialModal, setMaterialModal] = useState<{
    open: boolean;
    templateId?: string;
    scannedParts?: import("@/features/materials/types").MaterialOrderPart[];
  }>({ open: false });
  const [billingModal, setBillingModal] = useState(false);
  const [finishModal, setFinishModal] = useState<{ open: boolean; mission: Mission | null }>({
    open: false,
    mission: null,
  });
  const [missionsDone, setMissionsDone] = useState(0);
  const [arScannerOpen, setArScannerOpen] = useState(false);

  useEffect(() => {
    if (!activeMissionId) return;
    const interval = setInterval(() => {
      if (missionStartRef.current) {
        setElapsedSeconds(Math.floor((Date.now() - missionStartRef.current.getTime()) / 1000));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activeMissionId]);

  const handleOpenMaterialOrder = (templateId?: string) => {
    setMaterialModal({ open: true, templateId });
  };

  const handleSubmitOrder = async (
    _parts: MaterialOrderPart[],
    _urgency: "low" | "normal" | "high"
  ) => {
    setMaterialModal({ open: false });
    toast.success("Commande matériel envoyée");
  };

  const handleNavigate = () => {
    if (!selectedMission) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selectedMission.address)}`;
    window.open(url, "_blank");
  };

  const handleCall = () => {
    if (!selectedMission) return;
    const phone = selectedMission.phone ?? "+3221234567";
    window.open(`tel:${phone}`);
  };

  const doFinishMission = (billingTemplateId: string | null) => {
    const target = finishModal.mission;
    if (!target) return;
    setFinishModal({ open: false, mission: null });
    setActiveMissionId(null);
    missionStartRef.current = null;
    setElapsedSeconds(0);
    setTechStatus("available");
    setMissionsDone((n) => n + 1);
    toast.success(
      billingTemplateId
        ? `Mission clôturée et facturée — ${target.client}`
        : `Mission clôturée — ${target.client}`
    );
  };

  const handleStartStop = (mission?: {
    id: string;
    client: string;
    type?: string;
    address?: string;
  }) => {
    const target = mission ?? selectedMission;
    if (!target) return;
    if (activeMissionId === target.id) {
      const full = mockMissions.find((m) => m.id === target.id) ?? null;
      setFinishModal({ open: true, mission: full });
    } else {
      setActiveMissionId(target.id);
      missionStartRef.current = new Date();
      setElapsedSeconds(0);
      setTechStatus("on-mission");
      toast.success(`Mission démarrée — ${target.client}`);
    }
  };

  const handleNavigateFromList = (address: string) => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`,
      "_blank"
    );
  };

  const handleCallFromList = (phone: string) => {
    window.open(`tel:${phone || "+3221234567"}`);
  };

  return (
    <div className="w-screen h-screen flex bg-slate-900 overflow-hidden font-sans">
      <LeftPanel
        status={techStatus}
        onStatusChange={setTechStatus}
        missionsToday={mockMissions.length}
        missionsDone={missionsDone}
        onOpenMaterialOrder={() => handleOpenMaterialOrder()}
        onOpenInvoice={() => setBillingModal(true)}
        onOpenPhoto={() => setArScannerOpen(true)}
      />

      <CenterPanel
        missions={mockMissions}
        onSelectMission={setSelectedMission}
        selectedMissionId={selectedMission?.id}
        activeMissionId={activeMissionId}
        onNavigate={handleNavigateFromList}
        onCall={handleCallFromList}
        onStartStop={handleStartStop}
      />

      <RightPanel
        selectedMission={selectedMission}
        isActive={selectedMission?.id === activeMissionId}
        elapsedSeconds={elapsedSeconds}
        onNavigate={handleNavigate}
        onCall={handleCall}
        onStartStop={() => handleStartStop()}
        onOpenMaterialOrder={handleOpenMaterialOrder}
      />

      {/* Mission Finish Modal */}
      {finishModal.open && finishModal.mission && (
        <MissionFinishModal
          mission={finishModal.mission}
          elapsedSeconds={elapsedSeconds}
          onConfirm={doFinishMission}
          onCancel={() => setFinishModal({ open: false, mission: null })}
        />
      )}

      {/* AR Scanner */}
      {arScannerOpen && (
        <ARScanner
          onClose={() => setArScannerOpen(false)}
          onIdentified={(part) => {
            setArScannerOpen(false);
            setMaterialModal({
              open: true,
              scannedParts: [
                { description: part.description, quantity: 1, reference: part.reference },
                { description: "Main d'œuvre (Heure)", quantity: 1, reference: "" },
                { description: "Déplacement forfaitaire", quantity: 1, reference: "" },
              ],
            });
            toast.success(`Pièce identifiée : ${part.description}`);
          }}
        />
      )}

      {/* Material Order Modal */}
      {materialModal.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) setMaterialModal({ open: false });
          }}
        >
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <MaterialOrderForm
              interventionId={selectedMission?.id ?? "cockpit"}
              technicianUid="tech-cockpit"
              initialTemplateId={materialModal.templateId}
              initialParts={materialModal.scannedParts}
              onSubmitOrder={handleSubmitOrder}
              onCancel={() => setMaterialModal({ open: false })}
            />
          </div>
        </div>
      )}

      {/* Billing Templates Modal */}
      {billingModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) setBillingModal(false);
          }}
        >
          <div className="w-full max-w-lg bg-white rounded-[24px] p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">Templates Facturation</h2>
              <button
                onClick={() => setBillingModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold transition-colors"
              >
                ×
              </button>
            </div>
            <div className="space-y-3">
              {BILLING_TEMPLATES.map((tpl) => {
                const totalCents = tpl.lines.reduce(
                  (sum, l) => sum + l.unitPriceCents * l.quantity,
                  0
                );
                return (
                  <div
                    key={tpl.id}
                    className="border border-slate-200 rounded-2xl p-4 hover:border-blue-200 hover:bg-blue-50/30 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{tpl.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {tpl.lines.length} ligne{tpl.lines.length > 1 ? "s" : ""}
                        </p>
                      </div>
                      <span className="font-black text-slate-900 text-lg tabular-nums">
                        {(totalCents / 100).toFixed(2)} €
                      </span>
                    </div>
                    <div className="space-y-1">
                      {tpl.lines.map((line, i) => (
                        <div key={i} className="flex justify-between text-xs text-slate-500">
                          <span>
                            {line.description} ×{line.quantity}
                          </span>
                          <span className="tabular-nums">
                            {((line.unitPriceCents * line.quantity) / 100).toFixed(2)} €
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => setBillingModal(false)}
              className="mt-6 w-full rounded-xl bg-slate-100 py-3 font-medium text-slate-700 hover:bg-slate-200 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
