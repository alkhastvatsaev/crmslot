import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { firestore, auth, isConfigured } from "@/core/config/firebase";
import { stripKnownSyntheticInterventions } from "@/core/config/devUiPreview";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { Intervention } from "./types";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";

export function useInterventions() {
  const workspace = useCompanyWorkspaceOptional();
  const tenantCompanyId =
    workspace?.isTenantUser && workspace.activeCompanyId ? workspace.activeCompanyId : null;

  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConfigured || !firestore || !auth) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return () => {};
    }

    let unsubSnap: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      unsubSnap?.();
      unsubSnap = undefined;

      const db = firestore;
      if (!user || !db) {
        setLoading(false);
        return;
      }

      const intRef = tenantCompanyId
        ? query(collection(db, "interventions"), where("companyId", "==", tenantCompanyId))
        : collection(db, "interventions");

      unsubSnap = onSnapshot(
        intRef,
        (snapshot) => {
          const parsed = stripKnownSyntheticInterventions(
            snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Intervention)),
          );
          setInterventions(parsed);
          setLoading(false);
        },
        (error) => {
          console.error("Erreur lecture interventions Firestore (Offline mode actif ?):", error);
          setLoading(false);
        },
      );
    });

    return () => {
      unsubSnap?.();
      unsubAuth();
    };
  }, [tenantCompanyId]);

  return { interventions, loading };
}
