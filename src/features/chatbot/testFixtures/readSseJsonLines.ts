/** Lit un corps SSE chatbot (une ligne JSON par événement). */
export async function readSseJsonLines(res: Response): Promise<unknown[]> {
  const text = await res.text();
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as unknown);
}
