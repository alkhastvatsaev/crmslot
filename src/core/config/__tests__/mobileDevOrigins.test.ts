import { resolveMobileDevOrigins } from "@/core/config/mobileDevOrigins";

describe("resolveMobileDevOrigins", () => {
  it("fusionne ngrok, LAN explicite et désactive l’auto", () => {
    const origins = resolveMobileDevOrigins({
      NODE_ENV: "development",
      NGROK_DEV_ORIGIN: "tunnel.ngrok-free.dev,192.168.0.100",
      MOBILE_LAN_ORIGIN: "192.168.0.101",
      MOBILE_DEV_ORIGINS_AUTO: "false",
    });
    expect(origins).toEqual(["tunnel.ngrok-free.dev", "192.168.0.100", "192.168.0.101"]);
  });

  it("n’ajoute pas de LAN en production", () => {
    expect(
      resolveMobileDevOrigins({
        NODE_ENV: "production",
        NGROK_DEV_ORIGIN: "tunnel.ngrok-free.dev",
      })
    ).toEqual(["tunnel.ngrok-free.dev"]);
  });
});
