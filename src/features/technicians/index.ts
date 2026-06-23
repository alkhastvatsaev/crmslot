/**
 * API publique technicians — profils techniciens, compétences, cockpit terrain.
 */
export type { Technician } from "@/features/technicians/types";
export { useTechnicians } from "@/features/technicians/hooks";
export { withTechnicianAuthUid } from "@/features/technicians/withTechnicianAuthUid";
export {
  INTERVENTION_SKILLS,
  SKILL_LABELS,
  technicianHasRequiredSkills,
  missingSkills,
} from "@/features/technicians/skillConstants";
export type { InterventionSkill } from "@/features/technicians/skillConstants";
export {
  TECHNICIAN_LAB_IN_CAROUSEL,
  TECHNICIAN_LAB_SLOT_INDEX,
} from "@/features/technicians/technicianLabConstants";
export { DEMO_DISPATCH_TECHNICIANS } from "@/features/technicians/demoTechnicianCatalog";
export { default as TourOptimizeButton } from "@/features/technicians/components/TourOptimizeButton";
export { default as TechnicianLabView } from "@/features/technicians/components/TechnicianLabView";
export { default as TechnicianCockpit } from "@/features/technicians/components/TechnicianCockpit";
export {
  default as TechnicianPerformanceDashboard,
  computeMetrics,
} from "@/features/technicians/components/TechnicianPerformanceDashboard";
export { default as MissionFinishModal } from "@/features/technicians/components/MissionFinishModal";
export { default as SkillsTagEditor } from "@/features/technicians/components/SkillsTagEditor";
