"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { ClientPortalAccountFields } from "@/features/auth";
import {
  readPortalAccessSession,
  writePortalAccessSession,
  type PortalAccessSession,
} from "@/features/interventions";

export type RequesterType = "particulier" | "login" | "register";

export interface RequesterProfile {
  type: RequesterType;
  firstName: string;
  lastName: string;
  companyName: string;
  phone: string;
  email: string;
  /** Adresse habituelle — compte client connecté (onglet Connexion). */
  usualAddress: string;
  defaultLatLng?: { lat: number; lng: number };
  accessCode: string;
}

export interface InterventionRequestData {
  /** Identifiant stable du gabarit (`SMART_FORM_TEMPLATES[].id`), pour sélection / changement de langue. */
  problemTemplateId: string;
  problemLabel: string;
  description: string;
  urgency: boolean;
  photoDataUrls: string[];
  interventionAddress: string;
  interventionLatLng?: { lat: number; lng: number };
  interventionDate?: string;
  interventionTime?: string;
  audioBlob?: Blob | null;
  audioUrl?: string | null;
}

interface RequesterHubContextValue {
  profile: RequesterProfile;
  setProfile: React.Dispatch<React.SetStateAction<RequesterProfile>>;
  requestData: InterventionRequestData;
  setRequestData: React.Dispatch<React.SetStateAction<InterventionRequestData>>;
  currentStep: number;
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
  lastSubmittedRequest: InterventionRequestData | null;
  setLastSubmittedRequest: (request: InterventionRequestData | null) => void;
  /** Dernier dossier Firestore créé (hub société — historique). */
  lastSubmittedInterventionId: string | null;
  setLastSubmittedInterventionId: (id: string | null) => void;
  /** Numéro de dossier (code portail) affiché après envoi. */
  lastSubmittedPortalAccessCode: string | null;
  setLastSubmittedPortalAccessCode: (code: string | null) => void;
  /** Ouverture suivi depuis notification push (`bmClientCase`). */
  pendingTrackingInterventionId: string | null;
  setPendingTrackingInterventionId: (id: string | null) => void;
  /** Profil compte client connecté (rail gauche — source de vérité pour la validation). */
  clientAccountFields: ClientPortalAccountFields | null;
  setClientAccountFields: (fields: ClientPortalAccountFields | null) => void;
  /** Force l’onglet droit du hub société (push / retour paiement). */
  portalRightTab: "tracking" | "chat" | "invoice" | "documents" | "timeline" | null;
  setPortalRightTab: (
    tab: "tracking" | "chat" | "invoice" | "documents" | "timeline" | null
  ) => void;
  portalAccessSession: PortalAccessSession | null;
  setPortalAccessSession: (session: PortalAccessSession | null) => void;
  isSubmitting: boolean;
  setIsSubmitting: (val: boolean) => void;
  validationFailedCount: number;
  triggerValidation: () => void;
  resetRequestOnly: () => void;
  resetRequestAfterSubmit: () => void;
  resetAll: () => void;
}

const defaultProfile: RequesterProfile = {
  type: "login",
  firstName: "",
  lastName: "",
  companyName: "",
  phone: "",
  email: "",
  usualAddress: "",
  accessCode: "",
};

const defaultRequestData: InterventionRequestData = {
  problemTemplateId: "",
  problemLabel: "",
  description: "",
  urgency: false,
  photoDataUrls: [],
  interventionAddress: "",
  interventionDate: "",
  interventionTime: "",
  audioBlob: null,
  audioUrl: null,
};

const RequesterHubContext = createContext<RequesterHubContextValue | null>(null);

const STORAGE_KEY = "map-belgique-requester-draft-v1";

export function RequesterHubProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<RequesterProfile>(defaultProfile);
  const [requestData, setRequestData] = useState<InterventionRequestData>(defaultRequestData);
  const [currentStep, setCurrentStep] = useState(0);
  const [lastSubmittedRequest, setLastSubmittedRequest] = useState<InterventionRequestData | null>(
    null
  );
  const [lastSubmittedInterventionId, setLastSubmittedInterventionId] = useState<string | null>(
    null
  );
  const [lastSubmittedPortalAccessCode, setLastSubmittedPortalAccessCode] = useState<string | null>(
    null
  );
  const [pendingTrackingInterventionId, setPendingTrackingInterventionId] = useState<string | null>(
    null
  );
  const [clientAccountFields, setClientAccountFields] = useState<ClientPortalAccountFields | null>(
    null
  );
  const [portalRightTab, setPortalRightTab] = useState<
    "tracking" | "chat" | "invoice" | "documents" | "timeline" | null
  >(null);
  const [portalAccessSession, setPortalAccessSessionState] = useState<PortalAccessSession | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationFailedCount, setValidationFailedCount] = useState(0);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as {
          profile?: RequesterProfile;
          requestData?: InterventionRequestData;
          lastSubmittedRequest?: InterventionRequestData | null;
          lastSubmittedInterventionId?: string | null;
          lastSubmittedPortalAccessCode?: string | null;
        };
        if (parsed.profile) {
          const p = parsed.profile;
          if ((p.type as string) === "societe") {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setProfile({ ...p, type: "login" });
          } else {
            setProfile(p);
          }
        }
        if (parsed.requestData) setRequestData({ ...defaultRequestData, ...parsed.requestData });
        if (parsed.lastSubmittedRequest)
          setLastSubmittedRequest({ ...defaultRequestData, ...parsed.lastSubmittedRequest });
        if (typeof parsed.lastSubmittedInterventionId === "string") {
          setLastSubmittedInterventionId(parsed.lastSubmittedInterventionId);
        }
        if (typeof parsed.lastSubmittedPortalAccessCode === "string") {
          setLastSubmittedPortalAccessCode(parsed.lastSubmittedPortalAccessCode);
        }
      }
    } catch {
      // ignore
    }
    setIsHydrated(true);
    setPortalAccessSessionState(readPortalAccessSession());
  }, []);

  const setPortalAccessSession = (session: PortalAccessSession | null) => {
    setPortalAccessSessionState(session);
    writePortalAccessSession(session);
  };

  // Save to local storage on change
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          profile,
          requestData,
          lastSubmittedRequest,
          lastSubmittedInterventionId,
          lastSubmittedPortalAccessCode,
        })
      );
    } catch {
      // ignore
    }
  }, [
    profile,
    requestData,
    lastSubmittedRequest,
    lastSubmittedInterventionId,
    lastSubmittedPortalAccessCode,
    isHydrated,
  ]);

  const triggerValidation = () => setValidationFailedCount((v) => v + 1);

  const resetRequestOnly = () => {
    setRequestData(defaultRequestData);
    setCurrentStep(0);
    setValidationFailedCount(0);
  };

  const resetRequestAfterSubmit = () => {
    setRequestData(defaultRequestData);
    setCurrentStep(4);
    setValidationFailedCount(0);
  };

  const resetAll = () => {
    setProfile(defaultProfile);
    setRequestData(defaultRequestData);
    setCurrentStep(0);
    setLastSubmittedRequest(null);
    setLastSubmittedInterventionId(null);
    setLastSubmittedPortalAccessCode(null);
    setPortalAccessSession(null);
    setClientAccountFields(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <RequesterHubContext.Provider
      value={{
        profile,
        setProfile,
        requestData,
        setRequestData,
        currentStep,
        setCurrentStep,
        lastSubmittedRequest,
        setLastSubmittedRequest,
        lastSubmittedInterventionId,
        setLastSubmittedInterventionId,
        lastSubmittedPortalAccessCode,
        setLastSubmittedPortalAccessCode,
        pendingTrackingInterventionId,
        setPendingTrackingInterventionId,
        clientAccountFields,
        setClientAccountFields,
        portalRightTab,
        setPortalRightTab,
        portalAccessSession,
        setPortalAccessSession,
        isSubmitting,
        setIsSubmitting,
        validationFailedCount,
        triggerValidation,
        resetRequestOnly,
        resetRequestAfterSubmit,
        resetAll,
      }}
    >
      {children}
    </RequesterHubContext.Provider>
  );
}

export function useRequesterHub() {
  const context = useContext(RequesterHubContext);
  if (!context) {
    throw new Error("useRequesterHub must be used within a RequesterHubProvider");
  }
  return context;
}
