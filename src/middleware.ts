import { NextResponse, type NextRequest } from "next/server";

/**
 * En-têtes de sécurité appliqués à toutes les réponses HTML/API.
 * CSP en `report-only` par défaut — passer `CSP_ENFORCE=true` pour basculer en enforce après audit.
 */
const SECURITY_HEADERS: Array<[string, string]> = [
  ["X-Content-Type-Options", "nosniff"],
  ["X-Frame-Options", "DENY"],
  ["Referrer-Policy", "strict-origin-when-cross-origin"],
  [
    "Permissions-Policy",
    [
      "accelerometer=()",
      "autoplay=(self)",
      "camera=(self)",
      "geolocation=(self)",
      "gyroscope=()",
      "magnetometer=()",
      "microphone=(self)",
      "midi=()",
      "payment=(self)",
      "usb=()",
    ].join(", "),
  ],
  // HSTS — Vercel l'ajoute déjà sur le edge, doublon inoffensif côté custom domain.
  ["Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload"],
  ["X-DNS-Prefetch-Control", "off"],
  ["Cross-Origin-Opener-Policy", "same-origin-allow-popups"],
  ["Cross-Origin-Resource-Policy", "same-site"],
  ["X-Permitted-Cross-Domain-Policies", "none"],
];

/**
 * CSP minimal pour CRMSLOT — Firebase, Mapbox, Stripe, Sentry, Google Fonts.
 * Étendre les `*-src` au cas par cas via PR + observation des rapports CSP.
 */
function buildCsp(): string {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    // 'unsafe-inline' temporaire — Next.js inline les hash de boot ; on durcira avec un nonce ensuite.
    // 'unsafe-eval' retiré : aucune lib runtime (Firebase, Mapbox, Stripe, Sentry) n'en a besoin.
    // Si une dépendance échoue après durcissement, l'ajouter via `CSP_ALLOW_UNSAFE_EVAL=true`.
    "script-src": [
      "'self'",
      "'unsafe-inline'",
      ...(process.env.CSP_ALLOW_UNSAFE_EVAL === "true" ? ["'unsafe-eval'"] : []),
      "https://js.stripe.com",
      "https://*.firebaseapp.com",
      "https://apis.google.com",
      "https://www.googletagmanager.com",
      "https://www.google.com",
      "https://www.gstatic.com",
    ],
    "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    "img-src": ["'self'", "data:", "blob:", "https:"],
    "font-src": ["'self'", "data:", "https://fonts.gstatic.com"],
    "connect-src": [
      "'self'",
      "https://*.googleapis.com",
      "https://*.firebaseio.com",
      "https://*.firebase.app",
      "https://firebaseinstallations.googleapis.com",
      "https://identitytoolkit.googleapis.com",
      "https://securetoken.googleapis.com",
      "https://api.mapbox.com",
      "https://events.mapbox.com",
      "https://api.stripe.com",
      "https://*.sentry.io",
      "https://www.google.com",
      "https://www.gstatic.com",
      "https://content-firebaseappcheck.googleapis.com",
      "wss://*.firebaseio.com",
    ],
    "frame-src": ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"],
    "media-src": ["'self'", "blob:", "https:"],
    "worker-src": ["'self'", "blob:"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };
  return Object.entries(directives)
    .map(([k, vs]) => `${k} ${vs.join(" ")}`)
    .join("; ");
}

function isStaticAsset(pathname: string): boolean {
  return (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/static/") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    /\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|otf|css|js|map)$/i.test(pathname)
  );
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const { pathname } = request.nextUrl;

  if (isStaticAsset(pathname)) return response;

  for (const [k, v] of SECURITY_HEADERS) response.headers.set(k, v);

  const csp = buildCsp();
  const enforce = process.env.CSP_ENFORCE === "true";
  response.headers.set(
    enforce ? "Content-Security-Policy" : "Content-Security-Policy-Report-Only",
    csp
  );

  return response;
}

export const config = {
  /** Exclut assets statiques et flux PWA (manifest, sw.js) du middleware. */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|workbox-.*|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|otf|css|js|map)$).*)",
  ],
};
