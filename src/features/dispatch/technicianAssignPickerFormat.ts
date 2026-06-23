import type { Technician } from "@/features/technicians";

export function formatAssignPickerDistanceKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export const assignPickerStatusLabelKey: Record<Technician["status"], string> = {
  available: "dispatch.assign_picker.status_available",
  en_route: "dispatch.assign_picker.status_en_route",
  on_site: "dispatch.assign_picker.status_on_site",
};
