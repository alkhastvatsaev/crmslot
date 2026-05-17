import React, { useState } from 'react';
import { CommissionRule, CommissionLevel, CommissionValueType } from '../types';

export const CommissionDashboard: React.FC = () => {
  const [rules, setRules] = useState<CommissionRule[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  
  // Form State
  const [level, setLevel] = useState<CommissionLevel>('group');
  const [targetId, setTargetId] = useState('');
  const [valueType, setValueType] = useState<CommissionValueType>('percentage');
  const [value, setValue] = useState<number>(0);

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    const newRule: CommissionRule = {
      id: Math.random().toString(36).substr(2, 9),
      level,
      targetId,
      valueType,
      value,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdByUid: 'admin-user',
    };
    setRules([...rules, newRule]);
    setIsAdding(false);
    // Reset form
    setTargetId('');
    setValue(0);
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Moteur de Commissions</h2>
          <p className="text-sm text-slate-500">Configurez les règles multi-niveaux pour vos équipes et techniciens.</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
        >
          {isAdding ? 'Annuler' : '+ Nouvelle Règle'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddRule} className="mb-8 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <h3 className="font-semibold text-slate-700 mb-4">Créer une nouvelle règle</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Niveau d'application</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as CommissionLevel)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="group">Groupe d'équipe</option>
                <option value="technician">Technicien</option>
                <option value="intervention">Intervention Spécifique</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">ID Cible</label>
              <input
                type="text"
                required
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                placeholder={level === 'group' ? 'ID du groupe...' : level === 'technician' ? 'ID du technicien...' : 'ID de l\'intervention...'}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type de commission</label>
              <select
                value={valueType}
                onChange={(e) => setValueType(e.target.value as CommissionValueType)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="percentage">Pourcentage (%)</option>
                <option value="fixed_amount">Montant Fixe (€)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Valeur</label>
              <input
                type="number"
                required
                min="0"
                step={valueType === 'percentage' ? "0.1" : "1"}
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700">
              Enregistrer la règle
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="py-3 px-4 font-semibold text-slate-600 text-sm">Niveau</th>
              <th className="py-3 px-4 font-semibold text-slate-600 text-sm">Cible</th>
              <th className="py-3 px-4 font-semibold text-slate-600 text-sm">Commission</th>
              <th className="py-3 px-4 font-semibold text-slate-600 text-sm text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rules.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-500">
                  Aucune règle configurée.
                </td>
              </tr>
            ) : (
              rules.map(rule => (
                <tr key={rule.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize bg-blue-100 text-blue-800">
                      {rule.level}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm font-mono text-slate-600">{rule.targetId}</td>
                  <td className="py-3 px-4 text-sm font-medium text-slate-800">
                    {rule.valueType === 'percentage' ? `${rule.value}%` : `${rule.value} €`}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button className="text-red-500 hover:text-red-700 text-sm font-medium">Supprimer</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
