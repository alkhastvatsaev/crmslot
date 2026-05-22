export interface MaterialOrderPart {
  description: string;
  quantity: number;
  reference?: string;
}

export interface MaterialOrder {
  id: string;
  interventionId: string;
  /** Nom client affiché (obligatoire à la création). */
  clientName?: string | null;
  technicianUid: string;
  partsRequested: MaterialOrderPart[];
  urgency: 'low' | 'normal' | 'high';
  status: 'pending' | 'ordered' | 'received' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}
