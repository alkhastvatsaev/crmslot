import { doc, getDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, firestore, storage } from "@/core/config/firebase";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import { dataUrlToBlob } from "@/features/interventions/finishJobCapture";
import { transitionInterventionFromTechnician } from "@/features/interventions/workflow/transitionInterventionFromTechnician";
import type { Intervention } from "@/features/interventions/types";

const UPLOAD_FILE_TIMEOUT_MS = 120_000;
const FIRESTORE_UPDATE_TIMEOUT_MS = 90_000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`${label} — délai dépassé`)), ms);
    }),
  ]);
}

type CompletionUploadParams = {
  interventionId: string;
  photoDataUrls: string[];
  signaturePngDataUrl: string;
  billingLines?: {
    description: string;
    quantity: number;
    unitPriceCents: number;
    reference?: string;
  }[];
};

async function uploadCompletionAssets(
  params: CompletionUploadParams
): Promise<{ photoUrls: string[]; sigUrl: string }> {
  const { interventionId, photoDataUrls, signaturePngDataUrl } = params;
  const st = storage;
  const user = auth?.currentUser;
  if (!st || !user) {
    throw new Error("Firebase indisponible");
  }
  const uid = user.uid;
  const basePath = `interventions/${interventionId}/completion`;
  const ts = Date.now();

  const photoUrls: string[] = await Promise.all(
    photoDataUrls.map(async (dataUrl, i) => {
      if (/^https?:\/\//i.test(dataUrl)) {
        return dataUrl;
      }
      const blob = dataUrlToBlob(dataUrl);
      const r = ref(st, `${basePath}/${uid}_${ts}_${i}.jpg`);
      return withTimeout(
        (async () => {
          await uploadBytes(r, blob, { contentType: "image/jpeg" });
          return getDownloadURL(r);
        })(),
        UPLOAD_FILE_TIMEOUT_MS,
        `Envoi photo ${i + 1}`
      );
    })
  );

  const sigBlob = dataUrlToBlob(signaturePngDataUrl);
  const sigRef = ref(st, `${basePath}/${uid}_${ts}_signature.png`);
  const sigUrl = await withTimeout(
    (async () => {
      await uploadBytes(sigRef, sigBlob, { contentType: "image/png" });
      return getDownloadURL(sigRef);
    })(),
    UPLOAD_FILE_TIMEOUT_MS,
    "Envoi signature"
  );

  return { photoUrls, sigUrl };
}

/** Met à jour photos / signature / facturation sans changer le statut `done`. */
export async function performCompletionAmend(params: CompletionUploadParams): Promise<void> {
  const { interventionId, billingLines } = params;
  const fs = firestore;
  const user = auth?.currentUser;
  if (!fs || !user) {
    throw new Error("Firebase indisponible");
  }

  const { photoUrls, sigUrl } = await uploadCompletionAssets(params);

  const res = await fetchWithAuth(
    `/api/interventions/${encodeURIComponent(interventionId)}/completion-amend`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        completionPhotoUrls: photoUrls,
        completionSignatureUrl: sigUrl,
        billingLines: billingLines ?? undefined,
      }),
    }
  );

  let body: { ok?: boolean; error?: string } = {};
  try {
    body = (await res.json()) as { ok?: boolean; error?: string };
  } catch {
    /* corps vide */
  }

  if (!res.ok || body.ok === false) {
    throw new Error(body.error?.trim() || `Erreur serveur (${res.status})`);
  }
}

/** Clôture initiale (`→ done`) ou amendement si le dossier est déjà `done`. */
export async function performCompletionUpload(params: CompletionUploadParams): Promise<void> {
  const { interventionId, photoDataUrls, signaturePngDataUrl, billingLines } = params;
  const fs = firestore;
  const user = auth?.currentUser;
  if (!fs || !user) {
    throw new Error("Firebase indisponible");
  }

  const snap = await getDoc(doc(fs, "interventions", interventionId));
  const data = snap.data() as Intervention | undefined;
  const fromStatus = data?.status ?? "in_progress";

  if (fromStatus === "done") {
    await performCompletionAmend(params);
    return;
  }

  const { photoUrls, sigUrl } = await uploadCompletionAssets({
    interventionId,
    photoDataUrls,
    signaturePngDataUrl,
    billingLines,
  });

  const uid = user.uid;
  const completedAtIso = new Date().toISOString();

  await withTimeout(
    transitionInterventionFromTechnician({
      interventionId,
      iv: {
        status: fromStatus,
        assignedTechnicianUid: data?.assignedTechnicianUid ?? uid,
        createdByUid: data?.createdByUid ?? null,
        companyId: data?.companyId ?? null,
      },
      toStatus: "done",
      extraPatch: {
        completionPhotoUrls: photoUrls,
        completionSignatureUrl: sigUrl,
        billingLines: billingLines ?? undefined,
        completedAt: completedAtIso,
        completedByUid: uid,
      },
    }),
    FIRESTORE_UPDATE_TIMEOUT_MS,
    "Clôture intervention"
  );
}
