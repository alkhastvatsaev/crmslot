import React from 'react';
import { Navigation, Phone, Play, Square, Package, ChevronRight, MapPin, Clock } from 'lucide-react';
import { TERRAIN_TEMPLATES } from '@/features/interventions/config/terrainTemplates';

interface Mission {
  id: string;
  client: string;
  type: string;
  address: string;
  eta: string;
  distance: string;
  phone?: string;
}

interface RightPanelProps {
  selectedMission: Mission | null;
  isActive: boolean;
  elapsedSeconds: number;
  onNavigate: () => void;
  onCall: () => void;
  onStartStop: () => void;
  onOpenMaterialOrder: (templateId?: string) => void;
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h${m.toString().padStart(2, '0')}`;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function getRelevantTemplates(missionType: string) {
  const lower = missionType.toLowerCase();
  let ids: string[];
  if (lower.includes('claqué') || lower.includes('claquée')) {
    ids = ['ouverture-porte', 'remplacement-cylindre'];
  } else if (lower.includes('clé') || lower.includes('perte')) {
    ids = ['remplacement-cylindre', 'remplacement-serrure-complete'];
  } else if (lower.includes('vitre')) {
    ids = ['vitre-simple'];
  } else {
    ids = ['depannage-general', 'ouverture-porte'];
  }
  return TERRAIN_TEMPLATES.filter(t => ids.includes(t.id));
}

export default function RightPanel({
  selectedMission,
  isActive,
  elapsedSeconds,
  onNavigate,
  onCall,
  onStartStop,
  onOpenMaterialOrder,
}: RightPanelProps) {

  /* Empty state */
  if (!selectedMission) {
    return (
      <div className="w-[380px] h-full bg-white border-l border-slate-100 flex flex-col items-center justify-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center">
          <MapPin className="w-7 h-7 text-slate-200" />
        </div>
        <p className="text-sm text-slate-300 font-medium">Sélectionner une mission</p>
      </div>
    );
  }

  const templates = getRelevantTemplates(selectedMission.type);

  return (
    <div className="w-[380px] h-full bg-white border-l border-slate-100 flex flex-col overflow-y-auto">

      {/* Header mission */}
      <div className={`px-5 py-4 border-b border-slate-100 ${isActive ? 'bg-emerald-50/50' : ''}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">
            {selectedMission.type}
          </span>
          {isActive && (
            <span className="flex items-center gap-1.5 text-emerald-600 text-sm font-black tabular-nums">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {formatElapsed(elapsedSeconds)}
            </span>
          )}
        </div>

        <h2 className="text-2xl font-black text-slate-900 leading-tight">{selectedMission.client}</h2>

        <p className="text-slate-400 text-sm mt-1.5 flex items-start gap-1">
          <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          {selectedMission.address}
        </p>

        <div className="flex gap-2 mt-3">
          <span className="flex items-center gap-1 bg-slate-100 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-600">
            <Clock className="w-3 h-3" />
            {selectedMission.eta}
          </span>
          <span className="bg-slate-100 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-600">
            {selectedMission.distance}
          </span>
        </div>
      </div>

      {/* Actions principales */}
      <div className="px-4 py-3 border-b border-slate-100">
        <div className="flex gap-2">
          <button
            onClick={onNavigate}
            title="Naviguer"
            className="w-14 h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white flex items-center justify-center transition-all"
          >
            <Navigation className="w-6 h-6" />
          </button>
          <button
            onClick={onCall}
            title="Appeler"
            className="w-14 h-14 rounded-2xl bg-blue-500 hover:bg-blue-600 active:scale-95 text-white flex items-center justify-center transition-all"
          >
            <Phone className="w-6 h-6" />
          </button>
          <button
            onClick={onStartStop}
            className={`flex-1 h-14 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-95 ${
              isActive
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-slate-900 hover:bg-slate-800'
            }`}
          >
            {isActive
              ? <><Square className="w-5 h-5" /> Stop</>
              : <><Play className="w-5 h-5" /> Start</>}
          </button>
        </div>
      </div>

      {/* Templates rapides — nom seul, pas de sub-text */}
      {templates.length > 0 && (
        <div className="px-4 py-3 border-b border-slate-100 space-y-1.5">
          {templates.map(tpl => (
            <button
              key={tpl.id}
              onClick={() => onOpenMaterialOrder(tpl.id)}
              className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-transparent hover:border-blue-200 active:scale-[0.99] transition-all group text-left"
            >
              <span className="font-semibold text-slate-800 text-sm">{tpl.name}</span>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors shrink-0" />
            </button>
          ))}
        </div>
      )}

      {/* Commande libre */}
      <div className="px-4 py-3 mt-auto">
        <button
          onClick={() => onOpenMaterialOrder()}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-bold transition-all"
        >
          <Package className="w-5 h-5" />
          Commander
        </button>
      </div>

    </div>
  );
}
