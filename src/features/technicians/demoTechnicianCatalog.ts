import { withTechnicianAuthUid } from "@/features/technicians/withTechnicianAuthUid";
import type { Technician } from "@/features/technicians/types";

/** Catalogue dispatch dev — aligné profil carrousel « MANSOUR » (page 3 technicien). */
export const DEMO_DISPATCH_TECHNICIANS: Technician[] = [
  withTechnicianAuthUid({
    id: "mansour",
    name: "Mansour",
    initial: "M",
    vehicle: "Camionnette #01",
    status: "available",
    location: { lat: 50.848, lng: 4.352 },
  }),
];
