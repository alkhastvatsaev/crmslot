import { getDownloadURL, ref, uploadBytes, type FirebaseStorage } from "firebase/storage";

function randomFileSuffix(): string {
  return Math.random().toString(36).slice(2, 10);
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}

function extFromMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "jpg";
}

export async function uploadPortalChatImagesFromDataUrls(
  storage: FirebaseStorage,
  params: { companyId: string; uid: string; dataUrls: string[] }
): Promise<string[]> {
  const trimmed = params.companyId.trim();
  if (!trimmed || params.dataUrls.length === 0) return [];

  const baseTs = Date.now();
  return Promise.all(
    params.dataUrls.map(async (dataUrl, i) => {
      const blob = await dataUrlToBlob(dataUrl);
      const ext = extFromMime(blob.type);
      const fileName = `${baseTs}-${i}-${randomFileSuffix()}.${ext}`;
      const r = ref(storage, `portal_ivana_chat/${trimmed}/${params.uid}/${fileName}`);
      const contentType = blob.type && blob.type.startsWith("image/") ? blob.type : "image/jpeg";
      await uploadBytes(r, blob, { contentType });
      return getDownloadURL(r);
    })
  );
}
