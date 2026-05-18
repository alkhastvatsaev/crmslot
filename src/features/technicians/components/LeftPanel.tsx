import React, { useState, useEffect } from 'react';
import { Package, FileText, Camera, AlertTriangle, MapPin, Clock } from 'lucide-react';
import TourOptimizeButton from './TourOptimizeButton';
import type { Intervention } from '@/features/interventions/types';

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

type TechnicianStatus = 'available' | 'on-mission' | 'break';

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

const STATUS_CONFIG: Record<TechnicianStatus, { label: string; color: string; dot: string }> = {
  available: { label: 'Disponible', color: 'bg-emerald-500', dot: 'bg-emerald-400' },
  'on-mission': { label: 'En mission', color: 'bg-blue-500', dot: 'bg-blue-400' },
  break: { label: 'Pause', color: 'bg-amber-500', dot: 'bg-amber-400' },
};

const STATUSES: TechnicianStatus[] = ['available', 'on-mission', 'break'];
const STATUS_SHORT: Record<TechnicianStatus, string> = {
  available: 'Dispo',
  'on-mission': 'Mission',
  break: 'Pause',
};

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
  const now = useClock();
  const timeStr = now.toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString('fr-BE', { weekday: 'short', day: 'numeric', month: 'short' });

  const QUICK_ACTIONS = [
    {
      icon: Package,
      label: 'Commande Matériel',
      sub: 'Templates ou libre',
      color: 'text-blue-400 group-hover:text-blue-300',
      onClick: onOpenMaterialOrder,
    },
    {
      icon: FileText,
      label: 'Créer Facture',
      sub: 'Templates disponibles',
      color: 'text-emerald-400 group-hover:text-emerald-300',
      onClick: onOpenInvoice,
    },
    {
      icon: Camera,
      label: 'Photo Terrain',
      sub: 'Scanner + documenter',
      color: 'text-violet-400 group-hover:text-violet-300',
      onClick: onOpenPhoto,
    },
    {
      icon: AlertTriangle,
      label: 'Appel Urgence',
      sub: '+32 2 123 45 67',
      color: 'text-red-400 group-hover:text-red-300',
      onClick: () => { window.open('tel:+3221234567'); },
    },
  ];

  return (
    <div className="w-72 h-full bg-zinc-950 border-r border-white/10 flex flex-col text-white">
      {/* Profile header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center font-black text-xl select-none">
            T
          </div>
          <div>
            <p className="font-bold text-white text-lg leading-tight">Technicien</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[status].dot} animate-pulse`} />
              <span className="text-xs text-white/60">{STATUS_CONFIG[status].label}</span>
            </div>
          </div>
        </div>

        {/* Horloge */}
        <div className="mb-4 text-center bg-white/5 rounded-xl px-3 py-2.5">
          <p className="text-2xl font-black text-white tabular-nums tracking-tight leading-none">{timeStr}</p>
          <p className="text-xs text-white/40 mt-1 capitalize">{dateStr}</p>
        </div>

        {/* Status toggle */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1">
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => onStatusChange(s)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                status === s
                  ? `${STATUS_CONFIG[s].color} text-white`
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {STATUS_SHORT[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex-1 p-4 space-y-2 overflow-y-auto">
        <p className="text-xs font-bold text-white/40 uppercase tracking-wider px-1 mb-3">Accès rapide</p>
        {onMissionsReordered && (
          <TourOptimizeButton missions={missions} onOptimized={onMissionsReordered} />
        )}
        {QUICK_ACTIONS.map(({ icon: Icon, label, sub, color, onClick }) => (
          <button
            key={label}
            onClick={onClick}
            className="group w-full flex items-center gap-3 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all text-left border border-transparent hover:border-white/10 active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
              <Icon className={`w-5 h-5 ${color} transition-colors`} />
            </div>
            <div>
              <p className="font-semibold text-white text-sm leading-tight">{label}</p>
              <p className="text-white/40 text-xs mt-0.5">{sub}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Daily stats */}
      <div className="p-4 border-t border-white/10">
        <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Aujourd&apos;hui</p>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-white">{missionsToday}</p>
            <p className="text-xs text-white/40 mt-0.5 flex items-center justify-center gap-1">
              <MapPin className="w-3 h-3" /> Total
            </p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-emerald-400">{missionsDone}</p>
            <p className="text-xs text-white/40 mt-0.5">Faites</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-amber-400">{missionsToday - missionsDone}</p>
            <p className="text-xs text-white/40 mt-0.5 flex items-center justify-center gap-1">
              <Clock className="w-3 h-3" /> Reste
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
