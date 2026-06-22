import { toast } from "sonner";
import type { User } from "firebase/auth";
import { auth, firestore, isConfigured } from "@/core/config/firebase";

export async function ensureUserForInterventionSubmit(): Promise<User | null> {
  if (!isConfigured) {
    toast.error("Firebase non configuré", {
      description:
        "Ajoutez les variables NEXT_PUBLIC_FIREBASE_* dans .env.local (voir .env.example), puis redémarrez npm run dev.",
    });
    return null;
  }
  if (!firestore) {
    toast.error("Base de données indisponible", {
      description:
        "Vérifiez NEXT_PUBLIC_FIREBASE_PROJECT_ID et la configuration du projet Firebase.",
    });
    return null;
  }
  if (!auth) {
    toast.error("Authentification indisponible", {
      description:
        "Firebase Auth n'a pas pu s'initialiser. Contrôlez la console et les clés .env.local.",
    });
    return null;
  }
  const existing = auth.currentUser;
  if (existing) return existing;
  toast.error("Connectez-vous pour envoyer", {
    description: "Utilisez la connexion par téléphone en haut de l'écran ou le portail client.",
  });
  return null;
}

export function createSilentWavBlob(durationMs = 1500): Blob {
  const sampleRate = 8000;
  const numChannels = 1;
  const bytesPerSample = 2;
  const numSamples = Math.max(1, Math.round((durationMs / 1000) * sampleRate));
  const dataSize = numSamples * numChannels * bytesPerSample;

  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * bytesPerSample, true);
  view.setUint16(32, numChannels * bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, dataSize, true);

  return new Blob([buffer], { type: "audio/wav" });
}
