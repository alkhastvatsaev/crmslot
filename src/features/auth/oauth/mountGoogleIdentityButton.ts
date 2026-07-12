import { loadOAuthSdkScript } from "@/features/auth/oauth/loadOAuthSdkScript";
import { resolveGoogleOAuthClientId } from "@/features/auth/oauth/resolveOAuthClientIds";

type MountOptions = {
  locale: string;
  width: number;
  onClick: () => void;
};

type GoogleIdentity = {
  accounts: {
    id: {
      initialize: (config: { client_id: string; locale?: string }) => void;
      renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
    };
  };
};

function mapLocale(locale: string): string {
  if (locale.startsWith("fr")) return "fr";
  if (locale.startsWith("nl")) return "nl";
  return "en";
}

/** Bouton Google officiel (GIS) — click_listener déclenche Firebase signInWithPopup côté app. */
export async function mountGoogleIdentityButton(
  container: HTMLElement,
  options: MountOptions
): Promise<() => void> {
  const clientId = resolveGoogleOAuthClientId();
  if (!clientId) throw new Error("google_oauth_client_id_missing");

  await loadOAuthSdkScript("https://accounts.google.com/gsi/client", "google-gsi-client");

  const google = (window as unknown as { google?: GoogleIdentity }).google;
  if (!google?.accounts?.id) throw new Error("google_identity_unavailable");

  container.replaceChildren();

  google.accounts.id.initialize({
    client_id: clientId,
    locale: mapLocale(options.locale),
  });

  google.accounts.id.renderButton(container, {
    type: "standard",
    theme: "outline",
    size: "large",
    text: "continue_with",
    shape: "rectangular",
    logo_alignment: "left",
    width: Math.min(400, Math.max(240, Math.round(options.width))),
    click_listener: options.onClick,
  });

  return () => {
    container.replaceChildren();
  };
}
