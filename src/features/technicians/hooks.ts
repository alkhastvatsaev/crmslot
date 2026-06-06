import { useState, useEffect } from "react";
import { logger } from "@/core/logger";
import { firestore, auth, isConfigured } from "@/core/config/firebase";
import { devUiPreviewEnabled } from "@/core/config/devUiPreview";
import { collection, onSnapshot, doc, setDoc } from "firebase/firestore";
import { Technician } from "./types";
import { withTechnicianAuthUid } from "@/features/technicians/withTechnicianAuthUid";
import { DEMO_DISPATCH_TECHNICIANS } from "@/features/technicians/demoTechnicianCatalog";

async function seedDemoTechnicians(techRef: ReturnType<typeof collection>) {
  await Promise.all(
    DEMO_DISPATCH_TECHNICIANS.map((t) => setDoc(doc(techRef, t.id), t, { merge: true }))
  );
}

export function useTechnicians() {
  const [technicians, setTechnicians] = useState<Technician[]>(DEMO_DISPATCH_TECHNICIANS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConfigured || !firestore || !auth) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTechnicians(DEMO_DISPATCH_TECHNICIANS);
      setLoading(false);
      const interval = setInterval(() => {
        setTechnicians((prev) =>
          prev.map((t) => {
            if (t.status === "en_route") {
              return {
                ...t,
                location: {
                  lat: t.location.lat + (Math.random() - 0.2) * 0.0002,
                  lng: t.location.lng + (Math.random() - 0.2) * 0.0002,
                },
              };
            }
            return t;
          })
        );
      }, 2000);
      return () => clearInterval(interval);
    }

    let unsubscribeAuth: (() => void) | undefined;
    let unsubscribeSnapshot: (() => void) | undefined;
    let active = true;

    const setupAuth = async () => {
      try {
        const { onAuthStateChanged } = await import("firebase/auth");
        if (!active) return;

        unsubscribeAuth = onAuthStateChanged(auth!, (user) => {
          if (!active) return;

          if (user) {
            const techRef = collection(firestore!, "technicians");

            if (unsubscribeSnapshot) unsubscribeSnapshot();

            unsubscribeSnapshot = onSnapshot(
              techRef,
              (snapshot) => {
                if (!active) return;

                if (devUiPreviewEnabled) {
                  // Only seed when the collection is empty to avoid snapshot → write → snapshot loop
                  if (snapshot.empty) {
                    void seedDemoTechnicians(techRef).catch((e) =>
                      logger.error("Seed techniciens démo:", {
                        error: e instanceof Error ? e.message : String(e),
                      })
                    );
                  }
                  setTechnicians(DEMO_DISPATCH_TECHNICIANS);
                  setLoading(false);
                  return;
                }

                if (!snapshot.empty) {
                  const parsed = snapshot.docs.map((d) =>
                    withTechnicianAuthUid({ ...d.data(), id: d.id } as Technician)
                  );
                  setTechnicians(parsed);

                  snapshot.docs.forEach((d) => {
                    const row = d.data() as Technician;
                    if (!(row.authUid ?? "").trim()) {
                      void setDoc(d.ref, withTechnicianAuthUid({ ...row, id: d.id }), {
                        merge: true,
                      });
                    }
                  });
                } else {
                  void seedDemoTechnicians(techRef).catch((e) =>
                    logger.error("Seed techniciens:", {
                      error: e instanceof Error ? e.message : String(e),
                    })
                  );
                  setTechnicians(DEMO_DISPATCH_TECHNICIANS);
                }
                setLoading(false);
              },
              (error) => {
                logger.error("Erreur lecture techniciens Firestore:", {
                  error: error instanceof Error ? error.message : String(error),
                });
                if (active) {
                  setTechnicians(devUiPreviewEnabled ? DEMO_DISPATCH_TECHNICIANS : []);
                  setLoading(false);
                }
              }
            );
          } else {
            if (active) {
              setTechnicians(devUiPreviewEnabled ? DEMO_DISPATCH_TECHNICIANS : []);
              setLoading(false);
              if (unsubscribeSnapshot) {
                unsubscribeSnapshot();
                unsubscribeSnapshot = undefined;
              }
            }
          }
        });
      } catch (error) {
        logger.error("Erreur initialisation Auth:", {
          error: error instanceof Error ? error.message : String(error),
        });
        if (active) {
          setTechnicians(devUiPreviewEnabled ? DEMO_DISPATCH_TECHNICIANS : []);
          setLoading(false);
        }
      }
    };

    setupAuth();

    return () => {
      active = false;
      if (unsubscribeAuth) unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  return { technicians, loading };
}
