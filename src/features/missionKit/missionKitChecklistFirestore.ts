import { doc, updateDoc } from "firebase/firestore";
import { firestore } from "@/core/config/firebase";

export type MissionKitChecklistPatch = {
  missionKitCheckedItemIds: string[];
  missionKitCheckedAt: string;
  missionKitCheckedByUid: string;
};

export function buildMissionKitChecklistPatch(
  checkedItemIds: string[],
  checkedByUid: string,
  now: Date = new Date()
): MissionKitChecklistPatch {
  return {
    missionKitCheckedItemIds: [...checkedItemIds],
    missionKitCheckedAt: now.toISOString(),
    missionKitCheckedByUid: checkedByUid.trim(),
  };
}

export async function saveMissionKitChecklistToFirestore(
  interventionId: string,
  checkedItemIds: string[],
  checkedByUid: string
): Promise<void> {
  if (!firestore) throw new Error("Firestore not configured");
  const id = interventionId.trim();
  const uid = checkedByUid.trim();
  if (!id || !uid) return;

  await updateDoc(
    doc(firestore, "interventions", id),
    buildMissionKitChecklistPatch(checkedItemIds, uid)
  );
}

export function shouldShowMissionKitMissingWarning(
  status: string | undefined,
  missingCount: number
): boolean {
  if (missingCount <= 0) return false;
  return status === "assigned" || status === "en_route";
}
