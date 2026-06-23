import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import { collection, getDocs, query, where, type Firestore } from "firebase/firestore";
import type { User } from "firebase/auth";
import type { InterventionRequestData, RequesterProfile } from "@/context/RequesterHubContext";
import {
  findPotentialDuplicates,
  type DuplicateMatch,
} from "@/features/interventions/detectDuplicates";
import type { Intervention } from "@/features/interventions/types";

export async function findRequesterDuplicateInterventions(params: {
  db: Firestore;
  user: User;
  tenantCompanyId: string | null;
  interventionCompanyId: string;
  profile: RequesterProfile;
  requestData: InterventionRequestData;
}): Promise<DuplicateMatch[]> {
  const { db, user, tenantCompanyId, interventionCompanyId, profile, requestData } = params;
  const problemForDedupe = requestData.description.trim() || requestData.problemLabel.trim();

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
      address: requestData.interventionAddress.trim(),
      problem: problemForDedupe,
      client: {
        firstName: profile.firstName.trim(),
        lastName: profile.lastName.trim(),
        phone: profile.phone.trim(),
        email: profile.email.trim(),
      },
    },
    existing,
    0.95
  );
}

export async function geocodeRequesterInterventionAddress(
  address: string
): Promise<{ lat: number; lng: number }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  try {
    const geo = await fetchWithAuth(`/api/maps/geocode?q=${encodeURIComponent(address.trim())}`, {
      signal: controller.signal,
    });
    const gj = (await geo.json()) as { location?: { lat: number; lng: number } };
    return {
      lat: gj.location?.lat ?? 50.8466,
      lng: gj.location?.lng ?? 4.3522,
    };
  } catch {
    return { lat: 50.8466, lng: 4.3522 };
  } finally {
    clearTimeout(timeoutId);
  }
}
