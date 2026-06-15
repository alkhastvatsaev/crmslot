import { isCapacitorNative } from "./capacitorRuntime";

let booted = false;

export async function bootNativeShell(): Promise<void> {
  if (booted || !isCapacitorNative()) return;
  booted = true;

  const [{ StatusBar, Style }, { SplashScreen }, { Keyboard }, { App }, { Network }] =
    await Promise.all([
      import("@capacitor/status-bar"),
      import("@capacitor/splash-screen"),
      import("@capacitor/keyboard"),
      import("@capacitor/app"),
      import("@capacitor/network"),
    ]);

  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setOverlaysWebView({ overlay: false });
  } catch {}

  try {
    await Keyboard.setAccessoryBarVisible({ isVisible: false });
  } catch {}

  await App.addListener("backButton", ({ canGoBack }) => {
    if (canGoBack) window.history.back();
  });

  await Network.addListener("networkStatusChange", (status) => {
    window.dispatchEvent(
      new CustomEvent("crmslot:network", {
        detail: { connected: status.connected, type: status.connectionType },
      })
    );
  });

  setTimeout(() => {
    SplashScreen.hide({ fadeOutDuration: 300 }).catch(() => {});
  }, 600);
}
