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
  withTechnicianAuthUid({
    id: "1",
    name: "Alexandre V.",
    initial: "A",
    vehicle: "Camionnette #02",
    status: "on_site",
    location: { lat: 50.84655, lng: 4.35415 },
  }),
  withTechnicianAuthUid({
    id: "3",
    name: "Boris K.",
    initial: "B",
    vehicle: "Camionnette #03",
    status: "en_route",
    location: { lat: 50.844, lng: 4.35 },
  }),
];
