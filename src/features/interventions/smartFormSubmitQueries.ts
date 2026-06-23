import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import { collection, getDocs, query, where } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";
import type { User } from "firebase/auth";
import { findPotentialDuplicates } from "@/features/interventions/detectDuplicates";
import type { Intervention } from "@/features/interventions/types";

export async function findSmartFormDuplicateInterventions(params: {
  db: Firestore;
  user: User;
  tenantCompanyId: string | null;
  interventionCompanyId: string | null;
  address: string;
  problem: string;
  firstName: string;
  lastName: string;
  phone: string;
}): Promise<Intervention[]> {
  const {
    db,
    user,
    tenantCompanyId,
    interventionCompanyId,
    address,
    problem,
    firstName,
    lastName,
    phone,
  } = params;

  if (!interventionCompanyId) return [];

  const qDup = tenantCompanyId
    ? query(collection(db, "interventions"), where("companyId", "==", interventionCompanyId))
    : query(collection(db, "interventions"), where("createdByUid", "==", user.uid));
  const snapDup = await getDocs(qDup);
  const existing = snapDup.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as unknown as Intervention[];

  return findPotentialDuplicates(
    {
      address: address.trim(),
      problem,
      client: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
      },
    },
    existing,
    0.95
  );
}

export async function geocodeSmartFormAddress(
  address: string,
  placeLatLng?: { lat: number; lng: number }
): Promise<{ lat: number; lng: number }> {
  const lat = placeLatLng?.lat;
  const lng = placeLatLng?.lng;

  if (lat !== undefined && lng !== undefined) {
    return { lat, lng };
  }

  try {
    const geo = await fetchWithAuth(`/api/maps/geocode?q=${encodeURIComponent(address.trim())}`);
    const gj = (await geo.json()) as { location?: { lat: number; lng: number } };
    return {
      lat: gj.location?.lat ?? 50.8466,
      lng: gj.location?.lng ?? 4.3522,
    };
  } catch {
    return { lat: 50.8466, lng: 4.3522 };
  }
}
