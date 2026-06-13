import os from "node:os";

/** IPv4 locales (Wi‑Fi / Ethernet) — pour `allowedDevOrigins` en dev mobile. */
export function detectLanIPv4Addresses(): string[] {
  const nets = os.networkInterfaces();
  const ips = new Set<string>();
  for (const iface of Object.values(nets)) {
    for (const net of iface ?? []) {
      if (net.family === "IPv4" && !net.internal) {
        ips.add(net.address);
      }
    }
  }
  return [...ips];
}

/** Origines dev autorisées (ngrok, IP LAN explicite, auto-détection). */
export function resolveMobileDevOrigins(env: NodeJS.ProcessEnv = process.env): string[] {
  const fromNgrok = (env.NGROK_DEV_ORIGIN ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const explicitLan = (env.MOBILE_LAN_ORIGIN ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const autoLan =
    env.NODE_ENV === "development" && env.MOBILE_DEV_ORIGINS_AUTO !== "false"
      ? detectLanIPv4Addresses()
      : [];

  return [...new Set([...fromNgrok, ...explicitLan, ...autoLan])];
}
