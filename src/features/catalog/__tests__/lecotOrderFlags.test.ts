import {
  lecotPlaywrightOrderEnabled,
  lecotPlaywrightSearchEnabled,
} from "@/features/catalog/lecotOrderFlags";

describe("lecotOrderFlags", () => {
  const env = process.env;

  afterEach(() => {
    process.env = env;
  });

  it("playwright order and search off by default (catalogue local / démo)", () => {
    delete process.env.LECOT_PLAYWRIGHT_ORDER;
    delete process.env.LECOT_PLAYWRIGHT_SEARCH;
    expect(lecotPlaywrightOrderEnabled()).toBe(false);
    expect(lecotPlaywrightSearchEnabled()).toBe(false);
  });

  it("playwright search off when env not true", () => {
    process.env.LECOT_PLAYWRIGHT_SEARCH = "false";
    expect(lecotPlaywrightSearchEnabled()).toBe(false);
  });

  it("playwright on when env true", () => {
    process.env.LECOT_PLAYWRIGHT_ORDER = "true";
    process.env.LECOT_PLAYWRIGHT_SEARCH = "true";
    expect(lecotPlaywrightOrderEnabled()).toBe(true);
    expect(lecotPlaywrightSearchEnabled()).toBe(true);
  });
});
