/**
 * API publique geofence — arrivée technicien GPS → transition statut.
 */
export {
  ARRIVAL_RADIUS_METERS,
  GEOFENCE_CHECK_INTERVAL_MS,
} from "@/features/geofence/geofenceConstants";
export { geofenceArrivalNextStatus } from "@/features/geofence/geofenceArrival";
export { haversineMeters } from "@/features/geofence/geofenceUtils";
export { useGeofenceMonitor } from "@/features/geofence/useGeofenceMonitor";
export { showGeofenceArrivalToast } from "@/features/geofence/components/GeofenceArrivalToast";
