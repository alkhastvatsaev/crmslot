"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type RequesterType = "particulier" | "login";

export interface RequesterProfile {
  type: RequesterType;
  firstName: string;
  lastName: string;
  companyName: string;
  phone: string;
  defaultAddress: string;
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
  /** Ouverture suivi depuis notification push (`bmClientCase`). */
  pendingTrackingInterventionId: string | null;
  setPendingTrackingInterventionId: (id: string | null) => void;
  isSubmitting: boolean;
  setIsSubmitting: (val: boolean) => void;
  validationFailedCount: number;
  triggerValidation: () => void;
  resetRequestOnly: () => void;
  resetAll: () => void;
}

const defaultProfile: RequesterProfile = {
  type: "login",
  firstName: "",
  lastName: "",
  companyName: "",
  phone: "",
  defaultAddress: "",
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
  const [lastSubmittedRequest, setLastSubmittedRequest] = useState<InterventionRequestData | null>(null);
  const [lastSubmittedInterventionId, setLastSubmittedInterventionId] = useState<string | null>(null);
  const [pendingTrackingInterventionId, setPendingTrackingInterventionId] = useState<string | null>(null);
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
      }
    } catch {
      // ignore
    }
    setIsHydrated(true);
  }, []);

  // Save to local storage on change
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ profile, requestData, lastSubmittedRequest, lastSubmittedInterventionId }),
      );
    } catch {
      // ignore
    }
  }, [profile, requestData, lastSubmittedRequest, lastSubmittedInterventionId, isHydrated]);

  const triggerValidation = () => setValidationFailedCount((v) => v + 1);

  const resetRequestOnly = () => {
    setRequestData(defaultRequestData);
    setCurrentStep(0);
    setValidationFailedCount(0);
  };

  const resetAll = () => {
    setProfile(defaultProfile);
    setRequestData(defaultRequestData);
    setCurrentStep(0);
    setLastSubmittedRequest(null);
    setLastSubmittedInterventionId(null);
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
        pendingTrackingInterventionId,
        setPendingTrackingInterventionId,
        isSubmitting,
        setIsSubmitting,
        validationFailedCount,
        triggerValidation,
        resetRequestOnly,
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
