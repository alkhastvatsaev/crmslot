import { fireEvent, screen } from "@testing-library/react";
import { render } from "@/test-utils/render";
import RequesterClientAccountPanel from "@/features/interventions/components/RequesterClientAccountPanel";

describe("RequesterClientAccountPanel", () => {
  it("renders account fields and sign out action", () => {
    const persistAccount = jest.fn(async () => undefined);
    const handleSignOut = jest.fn(async () => undefined);
    const updateField = jest.fn();

    render(
      <RequesterClientAccountPanel
        fields={{
          firstName: "Alice",
          lastName: "Dupont",
          email: "alice@example.be",
          phone: "+32 470 00 00 00",
          address: "Rue de la Loi 1",
        }}
        updateField={updateField}
        persistAccount={persistAccount}
        handleSignOut={handleSignOut}
        saving={false}
        validationFailedCount={0}
        shakeControls={{} as never}
      />
    );

    expect(screen.getByTestId("requester-client-account-panel")).toBeInTheDocument();
    expect(screen.getByTestId("requester-account-first-name")).toHaveValue("Alice");
    expect(screen.getByTestId("requester-account-email")).toHaveValue("alice@example.be");
    expect(screen.getByTestId("requester-account-address")).toHaveValue("Rue de la Loi 1");

    fireEvent.change(screen.getByTestId("requester-account-phone"), {
      target: { value: "+32 471 11 11 11" },
    });
    expect(updateField).toHaveBeenCalledWith("phone", "+32 471 11 11 11");

    fireEvent.blur(screen.getByTestId("requester-account-phone"));
    expect(persistAccount).toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("requester-account-signout"));
    expect(handleSignOut).toHaveBeenCalled();
  });
});
