/**
 * API publique equipment — inventaire équipements par client (flag equipmentInventory).
 */
export type { EquipmentStatus, ClientEquipment } from "@/features/equipment/types";
export {
  EQUIPMENT_STATUS_LABELS,
  EQUIPMENT_STATUS_STYLES,
  isServiceDueSoon,
  isServiceOverdue,
} from "@/features/equipment/types";
export {
  subscribeEquipmentByClient,
  subscribeEquipmentBySite,
  createEquipment,
  updateEquipment,
  retireEquipment,
} from "@/features/equipment/equipmentFirestore";
export { default as EquipmentPanel } from "@/features/equipment/components/EquipmentPanel";
