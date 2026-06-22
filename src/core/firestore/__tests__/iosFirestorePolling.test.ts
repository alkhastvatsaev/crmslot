import {
  IOS_FIRESTORE_POLL_MS,
  shouldUseIosFirestorePolling,
  startIosFirestorePoll,
} from "@/core/firestore/iosFirestorePolling";

const IPHONE_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15";

describe("iosFirestorePolling", () => {
  it("active le mode poll sur iPhone", () => {
    expect(shouldUseIosFirestorePolling(IPHONE_UA)).toBe(true);
  });

  it("planifie un pull immédiat puis périodique", () => {
    jest.useFakeTimers();
    const pull = jest.fn();
    const stop = startIosFirestorePoll(pull, true, 1_000);
    expect(pull).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(1_000);
    expect(pull.mock.calls.length).toBeGreaterThanOrEqual(2);
    stop();
    jest.useRealTimers();
  });
});
