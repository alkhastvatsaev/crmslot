import React, { useState } from 'react';
import { Map, List, Navigation, Phone, Play, Square, MapPin, Clock } from 'lucide-react';

interface Mission {
  id: string;
  client: string;
  type: string;
  address: string;
  eta: string;
  distance: string;
  phone?: string;
}

interface CenterPanelProps {
  missions: Mission[];
  onSelectMission: (mission: Mission | null) => void;
  selectedMissionId?: string;
  activeMissionId?: string | null;
  onNavigate: (address: string) => void;
  onCall: (phone: string) => void;
  onStartStop: (mission: Mission) => void;
}

const PIN_POSITIONS = [
  { top: '33%', left: '33%' },
  { top: '62%', left: '62%' },
  { top: '25%', left: '58%' },
  { top: '70%', left: '28%' },
];

export default function CenterPanel({
  missions,
  onSelectMission,
  selectedMissionId,
  activeMissionId,
  onNavigate,
  onCall,
  onStartStop,
}: CenterPanelProps) {
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  return (
    <div className="flex-1 h-full flex flex-col bg-slate-50 relative">

      {/* Toggle icônes seulement */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-white p-1 rounded-full shadow-md border border-slate-200 flex gap-1">
        <button
          onClick={() => setViewMode('map')}
          title="Vue carte"
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
            viewMode === 'map' ? 'bg-slate-900 text-white shadow' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <Map className="w-4.5 h-4.5" />
        </button>
        <button
          onClick={() => setViewMode('list')}
          title="Vue liste"
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
            viewMode === 'list' ? 'bg-slate-900 text-white shadow' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <List className="w-4.5 h-4.5" />
        </button>
      </div>

      {viewMode === 'map' ? (
        <div className="w-full h-full bg-slate-900 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                'linear-gradient(rgba(99,102,241,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.4) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 opacity-70" />

          {/* Position technicien */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
            <div className="w-5 h-5 bg-blue-500 rounded-full border-4 border-white shadow-lg shadow-blue-500/60 animate-pulse" />
            <div className="absolute inset-0 w-5 h-5 bg-blue-400 rounded-full opacity-30 scale-[3] animate-ping" />
          </div>

          {missions.map((mission, i) => {
            const pos = PIN_POSITIONS[i % PIN_POSITIONS.length];
            const isSelected = mission.id === selectedMissionId;
            const isActive = mission.id === activeMissionId;
            return (
              <div
                key={mission.id}
                className="absolute z-10 cursor-pointer group"
                style={{ top: pos.top, left: pos.left }}
                onClick={() => onSelectMission(mission)}
              >
                <div className={`transition-transform hover:scale-110 ${isActive ? 'text-emerald-400' : isSelected ? 'text-blue-400' : 'text-red-400'}`}>
                  <MapPin className="w-9 h-9 drop-shadow-xl" />
                </div>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex items-center whitespace-nowrap bg-white text-slate-800 text-xs font-bold px-3 py-1.5 rounded-full shadow border border-slate-100">
                  {mission.client}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="w-full h-full overflow-y-auto p-4 pt-20 space-y-3">
          {missions.map((mission) => {
            const isSelected = mission.id === selectedMissionId;
            const isActive = mission.id === activeMissionId;
            return (
              <div
                key={mission.id}
                onClick={() => onSelectMission(mission)}
                className={`bg-white rounded-2xl p-4 border-2 cursor-pointer transition-all ${
                  isActive
                    ? 'border-emerald-400 bg-emerald-50/20'
                    : isSelected
                    ? 'border-blue-400'
                    : 'border-slate-100 hover:border-slate-300'
                }`}
              >
                {/* Header mission */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wide">
                      {mission.type}
                    </span>
                    {isActive && (
                      <span className="flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-lg text-xs font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        En cours
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 font-medium flex items-center gap-1 shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                    {mission.eta}
                  </span>
                </div>

                <h3 className="text-xl font-black text-slate-900 leading-tight">{mission.client}</h3>
                <p className="text-slate-400 text-sm mt-0.5 truncate">{mission.address}</p>

                {/* Actions — stopPropagation pour ne pas sélectionner la carte */}
                <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onNavigate(mission.address)}
                    title="Naviguer"
                    className="w-12 h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white flex items-center justify-center transition-all"
                  >
                    <Navigation className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onCall(mission.phone ?? '')}
                    title="Appeler"
                    className="w-12 h-12 rounded-xl bg-blue-500 hover:bg-blue-600 active:scale-95 text-white flex items-center justify-center transition-all"
                  >
                    <Phone className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onStartStop(mission)}
                    className={`flex-1 h-12 rounded-xl font-bold flex items-center justify-center gap-2 text-sm transition-all active:scale-95 ${
                      isActive
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    {isActive
                      ? <><Square className="w-4 h-4" /> Stop</>
                      : <><Play className="w-4 h-4" /> Start</>}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
