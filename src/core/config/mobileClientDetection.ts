/** Détection client pure (testable sans React). */

export function isForceMobileQuery(search: string): boolean {
  return new URLSearchParams(search).get("forceMobile") === "1";
}

/** Android phone, iPhone, iPod — pas iPad / tablettes Android. */
export function isPhoneUserAgent(userAgent: string): boolean {
  const ua = userAgent || "";
  if (/Android/i.test(ua) && !/Tablet/i.test(ua)) return true;
  if (/iPhone|iPod/i.test(ua)) return true;
  return false;
}

export function detectMobileClient(userAgent: string, locationSearch: string): boolean {
  return isForceMobileQuery(locationSearch) || isPhoneUserAgent(userAgent);
}
