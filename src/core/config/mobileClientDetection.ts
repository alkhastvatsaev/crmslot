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

/** iPhone / iPod uniquement. */
export function isIphoneUserAgent(userAgent: string): boolean {
  return /iPhone|iPod/i.test(userAgent || "");
}

/** Mac bureau (Safari/Chrome) — exclut iPhone/iPad dans le UA. */
export function isMacDesktopUserAgent(userAgent: string): boolean {
  const ua = userAgent || "";
  if (!/Macintosh|Mac OS X/i.test(ua)) return false;
  if (/iPhone|iPod|iPad/i.test(ua)) return false;
  return true;
}

export type AppleOAuthClientHint = {
  userAgent: string;
  /** iPadOS se déguise en Mac ; >1 = tablette tactile. */
  maxTouchPoints?: number;
};

/** Sign in with Apple : iPhone/iPod ou Mac bureau (pas Android, Windows, iPad). */
export function isAppleOAuthClient(hint: AppleOAuthClientHint): boolean {
  const ua = hint.userAgent || "";
  if (isIphoneUserAgent(ua)) return true;
  if (!isMacDesktopUserAgent(ua)) return false;
  if ((hint.maxTouchPoints ?? 0) > 1) return false;
  return true;
}

export function detectMobileClient(userAgent: string, locationSearch: string): boolean {
  return isForceMobileQuery(locationSearch) || isPhoneUserAgent(userAgent);
}
