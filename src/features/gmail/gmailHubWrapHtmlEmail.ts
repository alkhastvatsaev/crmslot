/** Enveloppe HTML email pour affichage iframe sandboxé dans le hub. */
export function wrapHtmlEmail(html: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body { margin: 0; padding: 20px 24px; font-family: 'Outfit', system-ui, sans-serif;
      font-size: 14px; line-height: 1.6; color: #334155; background: transparent; }
    img { max-width: 100%; height: auto; }
    a { color: #0f172a; }
  </style></head><body>${html}</body></html>`;
}
