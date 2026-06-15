import type { CapacitorConfig } from "@capacitor/cli";
import { KeyboardResize, KeyboardStyle } from "@capacitor/keyboard";

const config: CapacitorConfig = {
  appId: "com.crmslot.app",
  appName: "CRMSLOT",
  webDir: "capacitor-shell",
  server: {
    // Doit pointer vers un domaine qui sert l'app en 200 (pas de 307 vers un autre hôte — casse la PWA).
    url: process.env.CAPACITOR_SERVER_URL?.trim() || "https://crmslot.vercel.app/m/technician",
    cleartext: false,
  },
  ios: {
    contentInset: "always",
    backgroundColor: "#0a0a0a",
  },
  android: {
    backgroundColor: "#0a0a0a",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 100,
      launchAutoHide: false,
      backgroundColor: "#0a0a0a",
      showSpinner: true,
      iosSpinnerStyle: "small",
      spinnerColor: "#ffffff",
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0a0a0a",
      overlaysWebView: false,
    },
    Keyboard: {
      resize: KeyboardResize.Native,
      style: KeyboardStyle.Default,
      resizeOnFullScreen: true,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
