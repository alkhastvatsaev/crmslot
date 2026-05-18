export type EquipmentStatus = "active" | "maintenance" | "retired";

export interface ClientEquipment {
  id: string;
  companyId: string;
  clientId: string;
  siteId?: string | null;
  label: string;
  brand?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  installDate?: string | null;
  lastServiceDate?: string | null;
  nextServiceDate?: string | null;
  status: EquipmentStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const EQUIPMENT_STATUS_LABELS: Record<EquipmentStatus, string> = {
  active: "Actif",
  maintenance: "En maintenance",
  retired: "Hors service",
};

export const EQUIPMENT_STATUS_STYLES: Record<EquipmentStatus, string> = {
  active: "bg-emerald-100 text-emerald-800",
  maintenance: "bg-amber-100 text-amber-800",
  retired: "bg-slate-100 text-slate-500",
};

export function isServiceDueSoon(equipment: ClientEquipment, withinDays = 30): boolean {
  if (!equipment.nextServiceDate) return false;
  const diff = new Date(equipment.nextServiceDate).getTime() - Date.now();
  return diff >= 0 && diff <= withinDays * 24 * 60 * 60 * 1000;
}

export function isServiceOverdue(equipment: ClientEquipment): boolean {
  if (!equipment.nextServiceDate) return false;
  return new Date(equipment.nextServiceDate).getTime() < Date.now();
}
