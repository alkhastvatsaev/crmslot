import React, { useState } from 'react';
import { InterventionCommission } from '../types';

interface CommissionOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCommission: InterventionCommission | null;
  baseAmount: number;
  onSaveOverride: (overrideAmount: number, reason: string) => Promise<void>;
}

export const CommissionOverrideModal: React.FC<CommissionOverrideModalProps> = ({
  isOpen,
  onClose,
  currentCommission,
  baseAmount,
  onSaveOverride,
}) => {
  const [overrideAmount, setOverrideAmount] = useState<number>(currentCommission?.finalCommissionAmount || 0);
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setIsSubmitting(true);
    try {
      await onSaveOverride(overrideAmount, reason);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-semibold text-slate-800 text-lg">Forcer la commission</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4 p-4 rounded-lg bg-blue-50 border border-blue-100 flex justify-between items-center">
            <span className="text-sm text-blue-800">Montant de base (Facture):</span>
            <span className="font-bold text-blue-900">{baseAmount.toFixed(2)} €</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nouveau montant de la commission (€)
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={overrideAmount}
                onChange={(e) => setOverrideAmount(Number(e.target.value))}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-lg font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Raison de l'override <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex: Prime exceptionnelle pour difficulté extrême..."
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none text-sm"
              />
              <p className="text-xs text-slate-500 mt-1">
                La justification est obligatoire pour la traçabilité comptable.
              </p>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reason.trim()}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Enregistrement...' : 'Appliquer l\'override'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
