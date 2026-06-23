/**
 * API publique maintenance — contrats maintenance récurrents.
 */
export type {
  MaintenanceFrequency,
  MaintenanceContractTemplate,
  MaintenanceContract,
} from "@/features/maintenance/types";
export { FREQUENCY_LABELS, FREQUENCY_DAYS } from "@/features/maintenance/types";
export {
  subscribeMaintenanceContracts,
  createMaintenanceContract,
  updateMaintenanceContract,
  deactivateMaintenanceContract,
} from "@/features/maintenance/maintenanceFirestore";
export type { InterventionDraft } from "@/features/maintenance/generateDueInterventions";
export {
  computeNextDueDate,
  findDueContracts,
  buildInterventionDraft,
} from "@/features/maintenance/generateDueInterventions";
export type { GenerateDueAdminResult } from "@/features/maintenance/server/generateDueInterventionsAdmin";
export { generateDueInterventionsAdmin } from "@/features/maintenance/server/generateDueInterventionsAdmin";
