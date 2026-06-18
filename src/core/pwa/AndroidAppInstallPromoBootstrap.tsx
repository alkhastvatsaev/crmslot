"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "@/core/i18n/I18nContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  useAndroidAppInstallPromo,
  type BeforeInstallPromptEvent,
} from "@/core/pwa/useAndroidAppInstallPromo";
import type { AndroidInstallPromoSurface } from "@/core/pwa/androidAppInstallPromo";

type Props = {
  surface: AndroidInstallPromoSurface;
  presentation: "toast" | "dialog";
};

function promoTitleKey(surface: AndroidInstallPromoSurface): string {
  return `pwa.install_promo.${surface}.title`;
}

function promoDescriptionKey(surface: AndroidInstallPromoSurface): string {
  return `pwa.install_promo.${surface}.description`;
}

export default function AndroidAppInstallPromoBootstrap({ surface, presentation }: Props) {
  const { t } = useTranslation();
  const { eligible, hasNativePrompt, install, dismiss } = useAndroidAppInstallPromo(surface);
  const [dialogOpen, setDialogOpen] = useState(false);
  const shownRef = useRef(false);

  const runInstall = useCallback(async () => {
    const outcome = await install();
    if (outcome === "manual") {
      toast.message(String(t("pwa.install_promo.chrome_manual_hint")), { duration: 10_000 });
    } else if (outcome === "accepted") {
      toast.success(String(t("pwa.install_promo.installed_toast")));
    }
    setDialogOpen(false);
  }, [install, t]);

  const runDismiss = useCallback(() => {
    dismiss();
    setDialogOpen(false);
  }, [dismiss]);

  useEffect(() => {
    if (!eligible || shownRef.current) return;

    const timer = window.setTimeout(() => {
      shownRef.current = true;
      if (presentation === "toast") {
        toast.message(String(t(promoTitleKey(surface))), {
          id: `android-install-promo-${surface}`,
          description: String(t(promoDescriptionKey(surface))),
          duration: 12_000,
          action: {
            label: String(t("pwa.install_promo.install")),
            onClick: () => void runInstall(),
          },
          cancel: {
            label: String(t("pwa.install_promo.later")),
            onClick: () => runDismiss(),
          },
        });
        return;
      }
      setDialogOpen(true);
    }, 1_500);

    return () => window.clearTimeout(timer);
  }, [eligible, presentation, runDismiss, runInstall, surface, t]);

  if (presentation !== "dialog") return null;

  return (
    <Dialog
      open={dialogOpen}
      onOpenChange={(open) => {
        if (!open) runDismiss();
        else setDialogOpen(true);
      }}
    >
      <DialogContent data-testid={`android-install-promo-dialog-${surface}`}>
        <DialogHeader>
          <DialogTitle>{String(t(promoTitleKey(surface)))}</DialogTitle>
          <DialogDescription>{String(t(promoDescriptionKey(surface)))}</DialogDescription>
        </DialogHeader>
        {!hasNativePrompt ? (
          <p className="text-[13px] text-muted-foreground">
            {String(t("pwa.install_promo.chrome_manual_hint"))}
          </p>
        ) : null}
        <DialogFooter className="border-t-0 bg-transparent p-0 pt-2 sm:justify-stretch">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            data-testid={`android-install-promo-later-${surface}`}
            onClick={runDismiss}
          >
            {String(t("pwa.install_promo.later"))}
          </Button>
          <Button
            type="button"
            className="flex-1"
            data-testid={`android-install-promo-install-${surface}`}
            onClick={() => void runInstall()}
          >
            {String(t("pwa.install_promo.install"))}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export type { BeforeInstallPromptEvent };
