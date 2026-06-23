import React, { useEffect, useState } from "react";
import { Package, Receipt, Camera, PhoneCall, Coffee, Zap, CheckCircle2 } from "lucide-react";
import TourOptimizeButton from "./TourOptimizeButton";
import type { Intervention } from "@/features/interventions";

type TechnicianStatus = "available" | "on-mission" | "break";

interface LeftPanelProps {
  status: TechnicianStatus;
  onStatusChange: (status: TechnicianStatus) => void;
  missionsToday: number;
  missionsDone: number;
  onOpenMaterialOrder: () => void;
  onOpenInvoice: () => void;
  onOpenPhoto: () => void;
  missions?: Intervention[];
  onMissionsReordered?: (ordered: Intervention[]) => void;
}

const STATUS_CONFIG: Record<
  TechnicianStatus,
  { label: string; ring: string; dot: string; icon: React.ComponentType<{ className?: string }> }
> = {
  available: {
    label: "Disponible",
    ring: "ring-emerald-500",
    dot: "bg-emerald-500",
    icon: CheckCircle2,
  },
  "on-mission": { label: "En mission", ring: "ring-blue-500", dot: "bg-blue-500", icon: Zap },
  break: { label: "Pause", ring: "ring-amber-400", dot: "bg-amber-400", icon: Coffee },
};

const STATUSES: TechnicianStatus[] = ["available", "on-mission", "break"];

export default function LeftPanel({
  status,
  onStatusChange,
  missionsToday,
  missionsDone,
  onOpenMaterialOrder,
  onOpenInvoice,
  onOpenPhoto,
  missions = [],
  onMissionsReordered,
}: LeftPanelProps) {
  const QUICK_ACTIONS = [
    {
      icon: Package,
      label: "Commander matériel",
      color: "text-blue-400",
      onClick: onOpenMaterialOrder,
    },
    { icon: Receipt, label: "Créer facture", color: "text-emerald-400", onClick: onOpenInvoice },
    { icon: Camera, label: "Photo terrain", color: "text-violet-400", onClick: onOpenPhoto },
    {
      icon: PhoneCall,
      label: "Appel urgence",
      color: "text-red-400",
      onClick: () => window.open("tel:+3221234567"),
    },
  ];

  return (
    <div className="w-[68px] h-full bg-zinc-950 border-r border-white/10 flex flex-col items-center py-5 gap-5">
      {/* Avatar + statut dot */}
      <div className="relative">
        <div
          className={`w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center font-black text-white text-lg select-none ring-2 ${STATUS_CONFIG[status].ring}`}
        >
          T
        </div>
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-zinc-950 ${STATUS_CONFIG[status].dot} animate-pulse`}
        />
      </div>

      {/* Status toggle — 3 petites pills colorées */}
      <div className="flex flex-col gap-1.5 w-10">
        {STATUSES.map((s) => {
          const Icon = STATUS_CONFIG[s].icon;
          return (
            <button
              key={s}
              onClick={() => onStatusChange(s)}
              title={STATUS_CONFIG[s].label}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 ${
                status === s
                  ? `bg-white/15 ring-1 ${STATUS_CONFIG[s].ring}`
                  : "bg-white/5 hover:bg-white/10 text-white/30 hover:text-white/60"
              }`}
            >
              <Icon
                className={`w-4.5 h-4.5 ${status === s ? STATUS_CONFIG[s].dot.replace("bg-", "text-") : ""}`}
              />
            </button>
          );
        })}
      </div>

      {/* Séparateur */}
      <div className="w-8 h-px bg-white/10" />

      {/* Quick actions */}
      <div className="flex flex-col items-center gap-2 flex-1">
        {onMissionsReordered && (
          <TourOptimizeButton missions={missions} onOptimized={onMissionsReordered} />
        )}
        {QUICK_ACTIONS.map(({ icon: Icon, label, color, onClick }) => (
          <button
            key={label}
            onClick={onClick}
            title={label}
            className="w-11 h-11 rounded-2xl bg-white/5 hover:bg-white/15 flex items-center justify-center transition-all active:scale-95"
          >
            <Icon className={`w-5 h-5 ${color}`} />
          </button>
        ))}
      </div>

      {/* Stats — couleur = sens, pas besoin de label */}
      <div className="flex flex-col items-center gap-3 pb-1">
        <div className="text-center" title={`${missionsToday} missions aujourd'hui`}>
          <p className="text-xl font-black text-white tabular-nums leading-none">{missionsToday}</p>
          <div className="w-1.5 h-1.5 rounded-full bg-white/20 mx-auto mt-1" />
        </div>
        <div className="text-center" title={`${missionsDone} terminées`}>
          <p className="text-xl font-black text-emerald-400 tabular-nums leading-none">
            {missionsDone}
          </p>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40 mx-auto mt-1" />
        </div>
        <div className="text-center" title={`${missionsToday - missionsDone} restantes`}>
          <p className="text-xl font-black text-amber-400 tabular-nums leading-none">
            {missionsToday - missionsDone}
          </p>
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400/40 mx-auto mt-1" />
        </div>
      </div>
    </div>
  );
}
