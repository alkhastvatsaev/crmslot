import type { CrmEventType } from "./crmActivityTypes";

type Translate = (key: string) => string;

function humanizeEventType(type: string): string {
  return type
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/** Libellé court affiché dans le flux CRM (titre de ligne / carte). */
export function crmHistoryEventLabel(t: Translate, type: CrmEventType | string): string {
  const key = `crmHistory.event.${type}`;
  const translated = t(key);
  if (translated !== key) return translated;
  return humanizeEventType(type);
}

/** Texte explicatif du panneau détail — retombe sur le libellé court si la clé manque. */
export function crmHistoryEventDetailBody(t: Translate, type: CrmEventType | string): string {
  const key = `crmHistory.detail.body.${type}`;
  const translated = t(key);
  if (translated !== key) return translated;
  return crmHistoryEventLabel(t, type);
}
