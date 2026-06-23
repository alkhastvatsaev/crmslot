const MAX_FILES = 6;
const MAX_TOTAL = 6;

export async function readIvanaChatImageDataUrls(
  files: FileList | null,
  currentCount: number
): Promise<string[]> {
  if (!files || files.length === 0) return [];

  const allowed = Array.from(files).filter((f) => f.type.startsWith("image/"));
  if (allowed.length === 0) return [];

  const remaining = Math.max(0, MAX_TOTAL - currentCount);
  const sliced = allowed.slice(0, Math.min(MAX_FILES, remaining));

  const readOne = (file: File) =>
    new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onerror = () => resolve(null);
      reader.onload = () => {
        const v = reader.result;
        resolve(typeof v === "string" ? v : null);
      };
      reader.readAsDataURL(file);
    });

  return (await Promise.all(sliced.map(readOne))).filter(Boolean) as string[];
}
