import { fireEvent, screen } from "@testing-library/react";
import { render } from "@/test-utils/render";
import RequesterPushNotificationButton from "@/features/interventions/components/RequesterPushNotificationButton";

const mockRegisterPush = jest.fn();

jest.mock("@/features/notifications/ClientPortalPushContext", () => ({
  useClientPortalPush: () => ({
    status: "idle",
    lastError: null,
    registerPush: mockRegisterPush,
  }),
}));

describe("RequesterPushNotificationButton", () => {
  it("renders enable button and calls registerPush", () => {
    render(<RequesterPushNotificationButton />);
    fireEvent.click(screen.getByTestId("requester-push-enable"));
    expect(mockRegisterPush).toHaveBeenCalled();
  });
});
