function randomNonce(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function createAppleSignInNonce(): Promise<{ rawNonce: string; hashedNonce: string }> {
  const rawNonce = randomNonce();
  const hashedNonce = await sha256Hex(rawNonce);
  return { rawNonce, hashedNonce };
}
