/** Convertit une réponse API (base64 standard) en URL blob pour iframe / téléchargement. */
export function base64ToBlobUrl(dataBase64: string, mimeType: string): string {
  const binary = atob(dataBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mimeType });
  return URL.createObjectURL(blob);
}

export function revokeBlobUrl(url: string | null): void {
  if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
}
