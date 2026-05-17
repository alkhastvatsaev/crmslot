import React, { useState } from 'react';
import { MaterialOrderPart } from '../types';

interface MaterialOrderFormProps {
  interventionId: string;
  technicianUid: string;
  onSubmitOrder: (parts: MaterialOrderPart[], urgency: 'low' | 'normal' | 'high') => Promise<void>;
  onCancel: () => void;
}

export const MaterialOrderForm: React.FC<MaterialOrderFormProps> = ({
  interventionId,
  technicianUid,
  onSubmitOrder,
  onCancel,
}) => {
  const [parts, setParts] = useState<MaterialOrderPart[]>([{ description: '', quantity: 1, reference: '' }]);
  const [urgency, setUrgency] = useState<'low' | 'normal' | 'high'>('normal');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddPart = () => {
    setParts([...parts, { description: '', quantity: 1, reference: '' }]);
  };

  const handleRemovePart = (index: number) => {
    setParts(parts.filter((_, i) => i !== index));
  };

  const handleChangePart = (index: number, field: keyof MaterialOrderPart, value: string | number) => {
    const newParts = [...parts];
    newParts[index] = { ...newParts[index], [field]: value };
    setParts(newParts);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Filter out empty rows
    const validParts = parts.filter(p => p.description.trim() !== '');
    if (validParts.length === 0) return;

    setIsSubmitting(true);
    try {
      await onSubmitOrder(validParts, urgency);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-[24px] shadow-sm border border-slate-200 p-6">
      <h2 className="text-xl font-bold text-slate-800 mb-2">Commander du Matériel</h2>
      <p className="text-sm text-slate-500 mb-6">
        Remplissez les détails des pièces nécessaires. Cette demande passera l'intervention en statut "En attente matériel".
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {parts.map((part, index) => (
            <div key={index} className="flex gap-3 items-start bg-slate-50 p-4 rounded-xl border border-slate-100 relative">
              {parts.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemovePart(index)}
                  className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-200 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-600 mb-1">Description (Obligatoire)</label>
                <input
                  type="text"
                  required
                  value={part.description}
                  onChange={(e) => handleChangePart(index, 'description', e.target.value)}
                  placeholder="Ex: Cylindre européen 30x30..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="w-24">
                <label className="block text-xs font-medium text-slate-600 mb-1">Qté</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={part.quantity}
                  onChange={(e) => handleChangePart(index, 'quantity', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-600 mb-1">Référence (Optionnel)</label>
                <input
                  type="text"
                  value={part.reference || ''}
                  onChange={(e) => handleChangePart(index, 'reference', e.target.value)}
                  placeholder="Ref fournisseur..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleAddPart}
          className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          <span>+</span> Ajouter une ligne
        </button>

        <div className="pt-4 border-t border-slate-100">
          <label className="block text-sm font-medium text-slate-700 mb-2">Urgence de la commande</label>
          <div className="flex gap-4">
            {(['low', 'normal', 'high'] as const).map((level) => (
              <label key={level} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="urgency"
                  value={level}
                  checked={urgency === level}
                  onChange={(e) => setUrgency(e.target.value as any)}
                  className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700 capitalize">
                  {level === 'low' ? 'Basse' : level === 'normal' ? 'Normale' : 'Haute'}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !parts.some(p => p.description.trim())}
            className="flex-[2] px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? 'Envoi...' : 'Commander et mettre en attente'}
          </button>
        </div>
      </form>
    </div>
  );
};
