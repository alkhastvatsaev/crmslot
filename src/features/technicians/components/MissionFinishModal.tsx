"use client";

import React, { useState } from 'react';
import { CheckCircle2, Clock, MapPin, ChevronRight } from 'lucide-react';
import { BILLING_TEMPLATES } from '@/features/interventions/config/terrainTemplates';

interface Mission {
  id: string;
  client: string;
  type: string;
  address: string;
}

interface MissionFinishModalProps {
  mission: Mission;
  elapsedSeconds: number;
  onConfirm: (selectedBillingTemplateId: string | null) => void;
  onCancel: () => void;
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}min`;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function getRelevantBillingTemplates(missionType: string) {
  const lower = missionType.toLowerCase();
  let ids: string[];
  if (lower.includes('claqué') || lower.includes('claquée')) {
    ids = ['bill-ouverture-claquee', 'bill-ouverture-forcee'];
  } else if (lower.includes('clé') || lower.includes('clés') || lower.includes('perte')) {
    ids = ['bill-cylindre-simple', 'bill-multipoint'];
  } else {
    ids = ['bill-depannage-general', 'bill-ouverture-claquee'];
  }
  const relevant = BILLING_TEMPLATES.filter(t => ids.includes(t.id));
  return relevant.length > 0 ? relevant : BILLING_TEMPLATES.slice(0, 2);
}

export default function MissionFinishModal({ mission, elapsedSeconds, onConfirm, onCancel }: MissionFinishModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const suggestedTemplates = getRelevantBillingTemplates(mission.type);
  const selectedTemplate = BILLING_TEMPLATES.find(t => t.id === selectedId);
  const totalCents = selectedTemplate
    ? selectedTemplate.lines.reduce((sum, l) => sum + l.unitPriceCents * l.quantity, 0)
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="w-full max-w-md bg-white rounded-[28px] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 px-6 pt-6 pb-5">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-white/60 text-sm font-medium">Clôturer la mission</p>
          </div>
          <h2 className="text-2xl font-black text-white leading-tight">{mission.client}</h2>
          <p className="text-white/50 text-sm mt-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 shrink-0" />{mission.address}
          </p>
          <div className="flex gap-3 mt-4">
            <span className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1.5 text-sm font-bold text-white/80">
              <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-bold uppercase">{mission.type}</span>
            </span>
            {elapsedSeconds > 0 && (
              <span className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 rounded-full px-3 py-1.5 text-sm font-bold tabular-nums">
                <Clock className="w-3.5 h-3.5" />
                {formatElapsed(elapsedSeconds)}
              </span>
            )}
          </div>
        </div>

        {/* Billing section */}
        <div className="p-6">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Facturation suggérée
          </p>
          <div className="space-y-2 mb-4">
            {suggestedTemplates.map(tpl => {
              const total = tpl.lines.reduce((sum, l) => sum + l.unitPriceCents * l.quantity, 0);
              const isSelected = selectedId === tpl.id;
              return (
                <button
                  key={tpl.id}
                  onClick={() => setSelectedId(isSelected ? null : tpl.id)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                  }`}
                >
                  <div>
                    <p className={`font-semibold text-sm ${isSelected ? 'text-emerald-800' : 'text-slate-800'}`}>
                      {tpl.name}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{tpl.lines.length} lignes</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-black text-lg tabular-nums ${isSelected ? 'text-emerald-700' : 'text-slate-900'}`}>
                      {(total / 100).toFixed(2)} €
                    </span>
                    {isSelected && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
                    {!isSelected && <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Total preview */}
          {totalCents !== null && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-4">
              <div className="flex justify-between items-center">
                <p className="text-sm font-bold text-emerald-800">Total sélectionné</p>
                <p className="text-2xl font-black text-emerald-700 tabular-nums">{(totalCents / 100).toFixed(2)} €</p>
              </div>
              <div className="mt-2 space-y-1">
                {selectedTemplate?.lines.map((line, i) => (
                  <div key={i} className="flex justify-between text-xs text-emerald-600/70">
                    <span>{line.description} ×{line.quantity}</span>
                    <span className="tabular-nums">{((line.unitPriceCents * line.quantity) / 100).toFixed(2)} €</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-3.5 rounded-2xl bg-slate-100 font-bold text-slate-700 hover:bg-slate-200 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={() => onConfirm(selectedId)}
              className="flex-[2] py-3.5 rounded-2xl font-bold text-white transition-colors bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98]"
            >
              {selectedId ? 'Clôturer + Facturer' : 'Clôturer la mission'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
