import { deleteDoc, doc, setDoc } from "firebase/firestore";
import type { DocumentReference, Firestore } from "firebase/firestore";
import { logger } from "@/core/logger";
import { recordDuplicateAlertIfNeeded } from "@/features/interventions/recordDuplicateAlertIfNeeded";

export function runSmartFormSubmitBackgroundTasks(params: {
  db: Firestore;
  newDocRef: DocumentReference;
  transcriptionPromise: Promise<string | null> | null;
  finalTranscription: string;
  interventionCompanyId: string | null;
  address: string;
  finalProblem: string;
  userUid: string;
  firstName: string;
  lastName: string;
  phone: string;
}): void {
  const {
    db,
    newDocRef,
    transcriptionPromise,
    finalTranscription,
    interventionCompanyId,
    address,
    finalProblem,
    userUid,
    firstName,
    lastName,
    phone,
  } = params;

  void (async () => {
    try {
      if (transcriptionPromise) {
        const result = await transcriptionPromise;
        if (result && !finalTranscription) {
          await setDoc(
            newDocRef,
            { transcription: result, problem: result, title: result.slice(0, 140) },
            { merge: true }
          );
        }
      }

      await recordDuplicateAlertIfNeeded({
        db,
        newInterventionId: newDocRef.id,
        companyId: interventionCompanyId,
        address: address.trim(),
        problem: finalProblem,
        createdByUid: userUid,
        client: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
        },
      }).catch(() => null);

      await deleteDoc(doc(db, "intervention_request_drafts", userUid)).catch(() => null);
    } catch (bgErr) {
      logger.error("Background submission error:", {
        error: bgErr instanceof Error ? bgErr.message : String(bgErr),
      });
    }
  })();
}
