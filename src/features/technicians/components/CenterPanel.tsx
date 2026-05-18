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
      {/* Toggle Carte / Liste */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 bg-white p-1 rounded-full shadow-lg border border-slate-200 flex gap-1">
        <button
          onClick={() => setViewMode('map')}
          className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${
            viewMode === 'map' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'
          }`}
        >
          <Map className="w-5 h-5" />
          Carte
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${
            viewMode === 'list' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'
          }`}
        >
          <List className="w-5 h-5" />
          Liste
        </button>
      </div>

      {viewMode === 'map' ? (
        <div className="w-full h-full bg-slate-900 relative overflow-hidden">
          {/* Dark grid background (offline-friendly map placeholder) */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                'linear-gradient(rgba(99,102,241,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.3) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 opacity-70" />

          {/* Technicien (position actuelle) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
            <div className="w-5 h-5 bg-blue-500 rounded-full border-4 border-white shadow-lg shadow-blue-500/60 animate-pulse" />
            <div className="absolute inset-0 w-5 h-5 bg-blue-400 rounded-full opacity-30 scale-[3] animate-ping" />
          </div>

          {/* Pins dynamiques */}
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
                <div className={`transition-transform hover:scale-110 ${isActive ? 'text-emerald-400' : isSelected ? 'text-blue-400' : 'text-red-500'}`}>
                  <MapPin className="w-10 h-10 drop-shadow-xl" />
                </div>
                {/* Tooltip client */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex items-center whitespace-nowrap bg-white text-slate-800 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg border border-slate-100">
                  {mission.client}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="w-full h-full overflow-y-auto p-6 pt-24 space-y-4">
          {missions.map((mission) => {
            const isSelected = mission.id === selectedMissionId;
            const isActive = mission.id === activeMissionId;
            return (
              <div
                key={mission.id}
                onClick={() => onSelectMission(mission)}
                className={`bg-white rounded-[32px] p-6 shadow-sm border-2 cursor-pointer transition-all hover:shadow-xl ${
                  isActive
                    ? 'border-emerald-500 shadow-emerald-500/10 bg-emerald-50/30'
                    : isSelected
                    ? 'border-blue-400 shadow-blue-500/10'
                    : 'border-slate-100 hover:border-slate-300'
                }`}
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider">
                        {mission.type}
                      </span>
                      {isActive && (
                        <span className="flex items-center gap-1.5 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          En cours
                        </span>
                      )}
                      <span className="text-slate-500 font-bold flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {mission.eta} · {mission.distance}
                      </span>
                    </div>
                    <h3 className="text-3xl font-black text-slate-900">{mission.client}</h3>
                    <p className="text-slate-500 font-medium text-lg mt-1">{mission.address}</p>
                  </div>
                </div>

                <div className="flex gap-3" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onNavigate(mission.address)}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white rounded-2xl py-4 font-bold flex justify-center items-center gap-2 text-lg transition-all"
                  >
                    <Navigation className="w-6 h-6" />
                    Naviguer
                  </button>
                  <button
                    onClick={() => onCall(mission.phone ?? '')}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 active:scale-[0.98] text-white rounded-2xl py-4 font-bold flex justify-center items-center gap-2 text-lg transition-all"
                  >
                    <Phone className="w-6 h-6" />
                    Appeler
                  </button>
                  <button
                    onClick={() => onStartStop(mission)}
                    className={`flex-1 active:scale-[0.98] rounded-2xl py-4 font-bold flex justify-center items-center gap-2 text-lg transition-all ${
                      isActive
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200'
                    }`}
                  >
                    {isActive ? <><Square className="w-6 h-6" /> Terminer</> : <><Play className="w-6 h-6" /> Démarrer</>}
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
