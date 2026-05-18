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
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}min`;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function getTypeBadgeColor(type: string): string {
  const lower = type.toLowerCase();
  if (lower.includes('porte') || lower.includes('claqué')) return 'bg-red-100 text-red-700';
  if (lower.includes('clé') || lower.includes('clés') || lower.includes('perte')) return 'bg-amber-100 text-amber-700';
  if (lower.includes('vitre') || lower.includes('verre')) return 'bg-blue-100 text-blue-700';
  return 'bg-slate-100 text-slate-700';
}

function getRelevantTemplates(missionType: string) {
  const lower = missionType.toLowerCase();
  let ids: string[];
  if (lower.includes('claqué') || lower.includes('claquée')) {
    ids = ['ouverture-porte', 'remplacement-cylindre'];
  } else if (lower.includes('clé') || lower.includes('clés') || lower.includes('perte')) {
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
  if (!selectedMission) {
    return (
      <div className="w-[450px] h-full bg-white border-l border-slate-200 flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
          <MapPin className="w-8 h-8 text-slate-300" />
        </div>
        <p className="text-slate-400 font-medium text-center leading-relaxed">
          Sélectionner une mission<br />pour voir les détails
        </p>
      </div>
    );
  }

  const badgeColor = getTypeBadgeColor(selectedMission.type);
  const templates = getRelevantTemplates(selectedMission.type);

  return (
    <div className="w-[450px] h-full bg-white border-l border-slate-200 flex flex-col overflow-y-auto">
      {/* Mission header */}
      <div className={`p-6 border-b border-slate-100 transition-colors ${isActive ? 'bg-emerald-50/60' : ''}`}>
        <div className="flex items-start justify-between mb-3">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${badgeColor}`}>
            {selectedMission.type}
          </span>
          {isActive && (
            <span className="flex items-center gap-1.5 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              En cours
            </span>
          )}
        </div>
        <h2 className="text-3xl font-black text-slate-900 leading-tight">{selectedMission.client}</h2>
        <p className="text-slate-500 font-medium text-base mt-2 flex items-start gap-1.5">
          <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
          {selectedMission.address}
        </p>
        <div className="flex gap-2 mt-4 flex-wrap">
          <span className="flex items-center gap-1.5 bg-slate-100 rounded-full px-3 py-1.5 text-sm font-bold text-slate-700">
            <Clock className="w-3.5 h-3.5" />
            {selectedMission.eta}
          </span>
          <span className="flex items-center gap-1.5 bg-slate-100 rounded-full px-3 py-1.5 text-sm font-bold text-slate-700">
            {selectedMission.distance}
          </span>
          {isActive && (
            <span className="flex items-center gap-1.5 bg-emerald-100 text-emerald-700 rounded-full px-3 py-1.5 text-sm font-bold tabular-nums">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              {formatElapsed(elapsedSeconds)}
            </span>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex gap-2">
          <button
            onClick={onNavigate}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white rounded-2xl py-3.5 font-bold flex justify-center items-center gap-1.5 text-sm transition-all"
          >
            <Navigation className="w-4 h-4" /> Naviguer
          </button>
          <button
            onClick={onCall}
            className="flex-1 bg-blue-500 hover:bg-blue-600 active:scale-[0.98] text-white rounded-2xl py-3.5 font-bold flex justify-center items-center gap-1.5 text-sm transition-all"
          >
            <Phone className="w-4 h-4" /> Appeler
          </button>
          <button
            onClick={onStartStop}
            className={`flex-1 active:scale-[0.98] text-white rounded-2xl py-3.5 font-bold flex justify-center items-center gap-1.5 text-sm transition-all ${
              isActive
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-slate-900 hover:bg-slate-800'
            }`}
          >
            {isActive ? (
              <><Square className="w-4 h-4" /> Terminer</>
            ) : (
              <><Play className="w-4 h-4" /> Démarrer</>
            )}
          </button>
        </div>
      </div>

      {/* Templates rapides */}
      {templates.length > 0 && (
        <div className="p-4 border-b border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Templates rapides</p>
          <div className="space-y-2">
            {templates.map(tpl => (
              <button
                key={tpl.id}
                onClick={() => onOpenMaterialOrder(tpl.id)}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 active:scale-[0.98] transition-all group text-left"
              >
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{tpl.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {tpl.lines.length} ligne{tpl.lines.length > 1 ? 's' : ''} · Lecot pré-filtré
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Commande matériel libre */}
      <div className="p-4">
        <button
          onClick={() => onOpenMaterialOrder()}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-bold transition-all"
        >
          <Package className="w-5 h-5" />
          Nouvelle commande matériel
        </button>
      </div>
    </div>
  );
}
