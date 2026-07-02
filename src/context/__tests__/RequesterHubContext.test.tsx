import React from "react";
import { act, render, screen } from "@testing-library/react";
import { RequesterHubProvider, useRequesterHub } from "@/context/RequesterHubContext";

jest.mock("@/features/interventions", () => ({
  readPortalAccessSession: jest.fn(() => null),
  writePortalAccessSession: jest.fn(),
}));

const STORAGE_KEY = "map-belgique-requester-draft-v1";

function Probe() {
  const hub = useRequesterHub();
  return (
    <div>
      <span data-testid="step">{hub.currentStep}</span>
      <span data-testid="validation-fails">{hub.validationFailedCount}</span>
      <span data-testid="profile-type">{hub.profile.type}</span>
      <span data-testid="first-name">{hub.profile.firstName}</span>
      <button type="button" onClick={() => hub.triggerValidation()}>
        validate
      </button>
      <button type="button" onClick={() => hub.resetAll()}>
        reset
      </button>
    </div>
  );
}

describe("RequesterHubContext", () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.clearAllMocks();
  });

  it("throw si useRequesterHub hors provider", () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(/RequesterHubProvider/);
  });

  it("expose les valeurs initiales", () => {
    render(
      <RequesterHubProvider>
        <Probe />
      </RequesterHubProvider>
    );
    expect(screen.getByTestId("step")).toHaveTextContent("0");
    expect(screen.getByTestId("profile-type")).toHaveTextContent("particulier");
  });

  it("incrémente validationFailedCount via triggerValidation", () => {
    render(
      <RequesterHubProvider>
        <Probe />
      </RequesterHubProvider>
    );
    act(() => {
      screen.getByRole("button", { name: "validate" }).click();
    });
    expect(screen.getByTestId("validation-fails")).toHaveTextContent("1");
  });

  it("resetAll remet le profil par défaut et réécrit le brouillon", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ profile: { type: "login", firstName: "X" } })
    );

    render(
      <RequesterHubProvider>
        <Probe />
      </RequesterHubProvider>
    );

    act(() => {
      screen.getByRole("button", { name: "reset" }).click();
    });

    expect(screen.getByTestId("first-name")).toHaveTextContent("");
    expect(screen.getByTestId("profile-type")).toHaveTextContent("particulier");
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
    expect(stored.profile?.firstName).toBe("");
  });

  it("hydrate le profil et migre le type legacy societe → login", async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        profile: {
          type: "societe",
          firstName: "Marie",
          lastName: "",
          companyName: "",
          phone: "",
          email: "",
          usualAddress: "",
          accessCode: "",
        },
      })
    );

    render(
      <RequesterHubProvider>
        <Probe />
      </RequesterHubProvider>
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByTestId("profile-type")).toHaveTextContent("login");
    expect(screen.getByTestId("first-name")).toHaveTextContent("Marie");
  });
});

function ExtendedProbe() {
  const hub = useRequesterHub();
  return (
    <div>
      <span data-testid="step">{hub.currentStep}</span>
      <span data-testid="description">{hub.requestData.description}</span>
      <span data-testid="submitting">{String(hub.isSubmitting)}</span>
      <button type="button" onClick={() => hub.resetRequestOnly()}>
        reset-request
      </button>
      <button type="button" onClick={() => hub.resetRequestAfterSubmit()}>
        reset-after-submit
      </button>
      <button
        type="button"
        onClick={() => hub.setRequestData((d) => ({ ...d, description: "fuite" }))}
      >
        desc
      </button>
      <button type="button" onClick={() => hub.setIsSubmitting(true)}>
        submit-on
      </button>
      <button
        type="button"
        onClick={() =>
          hub.setPortalAccessSession({
            emailNormalized: "a@test.com",
            verifiedAt: "2026-01-01",
            interventionIds: ["iv-1"],
            interventions: [],
          })
        }
      >
        session
      </button>
    </div>
  );
}

describe("RequesterHubContext actions", () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.clearAllMocks();
  });

  it("resetRequestOnly remet le formulaire à zéro", () => {
    render(
      <RequesterHubProvider>
        <ExtendedProbe />
      </RequesterHubProvider>
    );
    act(() => {
      screen.getByRole("button", { name: "desc" }).click();
    });
    expect(screen.getByTestId("description")).toHaveTextContent("fuite");
    act(() => {
      screen.getByRole("button", { name: "reset-request" }).click();
    });
    expect(screen.getByTestId("description")).toHaveTextContent("");
    expect(screen.getByTestId("step")).toHaveTextContent("0");
  });

  it("resetRequestAfterSubmit positionne l'étape suivi", () => {
    render(
      <RequesterHubProvider>
        <ExtendedProbe />
      </RequesterHubProvider>
    );
    act(() => {
      screen.getByRole("button", { name: "reset-after-submit" }).click();
    });
    expect(screen.getByTestId("step")).toHaveTextContent("4");
  });

  it("setPortalAccessSession persiste via writePortalAccessSession", () => {
    const { writePortalAccessSession } = jest.requireMock("@/features/interventions") as {
      writePortalAccessSession: jest.Mock;
    };
    render(
      <RequesterHubProvider>
        <ExtendedProbe />
      </RequesterHubProvider>
    );
    act(() => {
      screen.getByRole("button", { name: "session" }).click();
    });
    expect(writePortalAccessSession).toHaveBeenCalledWith(
      expect.objectContaining({ emailNormalized: "a@test.com" })
    );
  });

  it("setIsSubmitting met à jour l'état d'envoi", () => {
    render(
      <RequesterHubProvider>
        <ExtendedProbe />
      </RequesterHubProvider>
    );
    act(() => {
      screen.getByRole("button", { name: "submit-on" }).click();
    });
    expect(screen.getByTestId("submitting")).toHaveTextContent("true");
  });
});
