import { runWhenIdle } from "@/core/perf/runWhenIdle";

describe("runWhenIdle", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("exécute après minDelayMs", () => {
    const task = jest.fn();
    runWhenIdle(task, { minDelayMs: 100, idleTimeoutMs: 50 });

    expect(task).not.toHaveBeenCalled();
    jest.advanceTimersByTime(100);
    jest.runOnlyPendingTimers();

    expect(task).toHaveBeenCalledTimes(1);
  });

  it("annule si cleanup appelé", () => {
    const task = jest.fn();
    const cancel = runWhenIdle(task, { minDelayMs: 0, idleTimeoutMs: 10 });
    cancel();
    jest.runOnlyPendingTimers();
    expect(task).not.toHaveBeenCalled();
  });
});
