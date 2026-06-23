import React from "react";
import { render, screen, act } from "@testing-library/react";
import { RequesterHubProvider, useRequesterHub } from "@/context/RequesterHubContext";

const STORAGE_KEY = "map-belgique-requester-draft-v1";

// Consumer component to expose context values via data-testid
function TestConsumer() {
  const {
    profile,
    setProfile,
    requestData,
    setRequestData,
    currentStep,
    setCurrentStep,
    lastSubmittedInterventionId,
    setLastSubmittedInterventionId,
    validationFailedCount,
    triggerValidation,
    resetAll,
    resetRequestOnly,
  } = useRequesterHub();

  return (
    <div>
      <span data-testid="profile-type">{profile.type}</span>
      <span data-testid="profile-firstname">{profile.firstName}</span>
      <span data-testid="current-step">{currentStep}</span>
      <span data-testid="problem-label">{requestData.problemLabel}</span>
      <span data-testid="validation-count">{validationFailedCount}</span>
      <span data-testid="last-id">{lastSubmittedInterventionId ?? ""}</span>

      <button
        data-testid="set-firstname"
        onClick={() => setProfile((p) => ({ ...p, firstName: "Alice" }))}
      />
      <button
        data-testid="set-problem"
        onClick={() => setRequestData((d) => ({ ...d, problemLabel: "Fuite" }))}
      />
      <button data-testid="set-step-3" onClick={() => setCurrentStep(3)} />
      <button data-testid="set-last-id" onClick={() => setLastSubmittedInterventionId("abc123")} />
      <button data-testid="trigger-validation" onClick={triggerValidation} />
      <button data-testid="reset-request" onClick={resetRequestOnly} />
      <button data-testid="reset-all" onClick={resetAll} />
    </div>
  );
}

function renderProvider() {
  return render(
    <RequesterHubProvider>
      <TestConsumer />
    </RequesterHubProvider>
  );
}

describe("RequesterHubContext", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("provides default profile type = login", () => {
    renderProvider();
    expect(screen.getByTestId("profile-type")).toHaveTextContent("login");
  });

  it("provides default currentStep = 0", () => {
    renderProvider();
    expect(screen.getByTestId("current-step")).toHaveTextContent("0");
  });

  it("updates profile firstName via setProfile", () => {
    renderProvider();
    act(() => screen.getByTestId("set-firstname").click());
    expect(screen.getByTestId("profile-firstname")).toHaveTextContent("Alice");
  });

  it("updates requestData problemLabel via setRequestData", () => {
    renderProvider();
    act(() => screen.getByTestId("set-problem").click());
    expect(screen.getByTestId("problem-label")).toHaveTextContent("Fuite");
  });

  it("increments validationFailedCount on triggerValidation", () => {
    renderProvider();
    expect(screen.getByTestId("validation-count")).toHaveTextContent("0");
    act(() => screen.getByTestId("trigger-validation").click());
    expect(screen.getByTestId("validation-count")).toHaveTextContent("1");
    act(() => screen.getByTestId("trigger-validation").click());
    expect(screen.getByTestId("validation-count")).toHaveTextContent("2");
  });

  it("resetRequestOnly resets step + requestData but keeps profile", () => {
    renderProvider();
    act(() => screen.getByTestId("set-firstname").click());
    act(() => screen.getByTestId("set-problem").click());
    act(() => screen.getByTestId("set-step-3").click());

    act(() => screen.getByTestId("reset-request").click());

    expect(screen.getByTestId("current-step")).toHaveTextContent("0");
    expect(screen.getByTestId("problem-label")).toHaveTextContent("");
    expect(screen.getByTestId("profile-firstname")).toHaveTextContent("Alice");
  });

  it("resetAll clears profile, requestData, step, lastId, and localStorage", () => {
    renderProvider();
    act(() => screen.getByTestId("set-firstname").click());
    act(() => screen.getByTestId("set-last-id").click());
    act(() => screen.getByTestId("set-step-3").click());

    act(() => screen.getByTestId("reset-all").click());

    expect(screen.getByTestId("profile-firstname")).toHaveTextContent("");
    expect(screen.getByTestId("current-step")).toHaveTextContent("0");
    expect(screen.getByTestId("last-id")).toHaveTextContent("");
    // After resetAll the persist effect re-runs with defaults — verify sensitive data is gone
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as {
      profile?: { firstName?: string; lastName?: string };
      lastSubmittedInterventionId?: string | null;
    };
    expect(stored.profile?.firstName ?? "").toBe("");
    expect(stored.lastSubmittedInterventionId ?? null).toBeNull();
  });

  it("persists profile + requestData to localStorage on change", () => {
    renderProvider();
    act(() => screen.getByTestId("set-firstname").click());
    act(() => screen.getByTestId("set-problem").click());

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as {
      profile?: { firstName?: string };
      requestData?: { problemLabel?: string };
    };
    expect(stored.profile?.firstName).toBe("Alice");
    expect(stored.requestData?.problemLabel).toBe("Fuite");
  });

  it("restores profile from localStorage on mount", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        profile: {
          type: "particulier",
          firstName: "Bob",
          lastName: "Martin",
          phone: "0477",
          email: "bob@test.be",
          companyName: "",
          accessCode: "",
        },
        requestData: {
          problemLabel: "Serrure cassée",
          problemTemplateId: "blocked",
          description: "",
          urgency: false,
          photoDataUrls: [],
          interventionAddress: "",
        },
      })
    );

    renderProvider();

    expect(screen.getByTestId("profile-type")).toHaveTextContent("particulier");
    expect(screen.getByTestId("profile-firstname")).toHaveTextContent("Bob");
    expect(screen.getByTestId("problem-label")).toHaveTextContent("Serrure cassée");
  });

  it("migrates legacy type='societe' to 'login' on restore", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        profile: {
          type: "societe",
          firstName: "Corp",
          lastName: "",
          phone: "",
          email: "",
          companyName: "ACME",
          accessCode: "",
        },
      })
    );

    renderProvider();

    expect(screen.getByTestId("profile-type")).toHaveTextContent("login");
  });

  it("sets and exposes lastSubmittedInterventionId", () => {
    renderProvider();
    act(() => screen.getByTestId("set-last-id").click());
    expect(screen.getByTestId("last-id")).toHaveTextContent("abc123");
  });
});
