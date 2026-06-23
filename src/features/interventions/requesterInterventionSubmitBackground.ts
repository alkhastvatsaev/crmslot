import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import { deleteDoc, doc, setDoc, type DocumentReference, type Firestore } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes, type FirebaseStorage } from "firebase/storage";
import type { User } from "firebase/auth";
import { logger } from "@/core/logger";
import type { RequesterProfile } from "@/features/interventions/context/RequesterHubContext";
import { recordDuplicateAlertIfNeeded } from "@/features/interventions/recordDuplicateAlertIfNeeded";
import type { RequesterClientFields } from "@/features/interventions/requesterInterventionSubmitPayload";

export function runRequesterSubmitBackgroundTasks(params: {
  db: Firestore;
  storage: FirebaseStorage | null;
  newDocRef: DocumentReference;
  user: User;
  interventionCompanyId: string;
  interventionAddress: string;
  problemForDedupe: string;
  profile: RequesterProfile;
  clientFields: RequesterClientFields;
  audioBlob: Blob | null | undefined;
}): void {
  const {
    db,
    storage,
    newDocRef,
    user,
    interventionCompanyId,
    interventionAddress,
    problemForDedupe,
    profile,
    clientFields,
    audioBlob,
  } = params;

  void (async () => {
    try {
      if (audioBlob && audioBlob.size > 0 && storage) {
        const mime = audioBlob.type || "audio/webm";
        const ext = mime.includes("mp4") ? "m4a" : "webm";

        try {
          const storagePath = `interventions_audio/${user.uid}/${Date.now()}.${ext}`;
          const audioRef = ref(storage, storagePath);
          await uploadBytes(audioRef, audioBlob);
          const firebaseAudioUrl = await getDownloadURL(audioRef);

          await setDoc(
            newDocRef,
            {
              audioUrl: firebaseAudioUrl,
              audioStoragePath: storagePath,
              audioMimeType: mime,
            },
            { merge: true }
          );
        } catch (err) {
          logger.error("Audio upload failed (Storage)", {
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }

      const { clientFirstRaw, clientLastRaw, clientPhoneRaw } = clientFields;

      recordDuplicateAlertIfNeeded({
        db,
        newInterventionId: newDocRef.id,
        companyId: interventionCompanyId,
        address: interventionAddress.trim(),
        problem: problemForDedupe,
        createdByUid: user.uid,
        client: {
          firstName: clientFirstRaw,
          lastName: clientLastRaw,
          phone: clientPhoneRaw,
          email: profile.email.trim(),
        },
      }).catch(() => null);

      deleteDoc(doc(db, "intervention_request_drafts", user.uid)).catch(() => null);
    } catch (bgErr) {
      logger.error("Background submission error:", {
        error: bgErr instanceof Error ? bgErr.message : String(bgErr),
      });
    }
  })();
}

export async function notifyRequesterPortalAccess(params: {
  interventionId: string;
  clientEmailRaw: string;
  user: User;
}): Promise<void> {
  const { interventionId, clientEmailRaw, user } = params;
  if (!clientEmailRaw) return;

  try {
    const res = await fetchWithAuth(
      `/api/interventions/${interventionId}/portal-access-notify`,
      { method: "POST" },
      { user }
    );
    const body = (await res.json().catch(() => ({}))) as {
      error?: string;
      emailSent?: boolean;
    };
    if (!res.ok) {
      throw new Error(body.error ?? `HTTP ${res.status}`);
    }
    if (body.emailSent === false) {
      logger.warn("Portal access welcome email not sent", {
        interventionId,
        to: clientEmailRaw,
      });
    }
  } catch (notifyError) {
    logger.warn("Portal access notify failed", {
      error: notifyError instanceof Error ? notifyError.message : String(notifyError),
    });
  }
}
