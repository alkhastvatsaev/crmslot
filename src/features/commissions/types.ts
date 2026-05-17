export type CommissionLevel = 'group' | 'technician' | 'intervention';
export type CommissionValueType = 'percentage' | 'fixed_amount';

export interface CommissionRule {
  id: string;
  companyId: string;
  isActive: boolean;
  /** Le niveau d'application de la règle (groupe d'équipe, technicien spécifique, ou exception par mission) */
  level: CommissionLevel;
  /** L'ID cible : l'ID du groupe, l'UID du technicien, ou l'ID de l'intervention */
  targetId: string;
  /** Type de valeur : pourcentage ou montant fixe */
  valueType: CommissionValueType;
  /** La valeur (ex: 15 pour 15%, ou 50 pour 50€) */
  value: number;
  createdAt: string;
  updatedAt: string;
  createdByUid: string;
}

export interface InterventionCommission {
  id: string; // Généralement l'ID de l'intervention
  interventionId: string;
  /** Montant de base sur lequel la commission est calculée (souvent le total de la facture) */
  baseAmount: number;
  /** Montant final de la commission calculée (avant ou après override) */
  finalCommissionAmount: number;
  /** La règle qui a été appliquée par le moteur (null si override total ou aucune règle trouvée) */
  appliedRuleId?: string | null;
  /** Indique si cette commission a été forcée manuellement (override) */
  isManualOverride: boolean;
  /** Justification de l'override manuel, requise pour la traçabilité */
  overrideReason?: string | null;
  overrideByUid?: string | null;
  updatedAt: string;
}
