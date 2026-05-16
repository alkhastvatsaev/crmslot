import { renderHook } from "@testing-library/react";
import { I18nProvider, useTranslation } from "@/core/i18n/I18nContext";

describe("I18nContext", () => {
  it("returns string from t() for nested keys", () => {
    const { result } = renderHook(() => useTranslation(), {
      wrapper: ({ children }) => <I18nProvider>{children}</I18nProvider>,
    });
    expect(result.current.t("auth.email_required")).toBe("Saisissez une adresse e-mail");
  });

  it("returns weekday array from tValue()", () => {
    const { result } = renderHook(() => useTranslation(), {
      wrapper: ({ children }) => <I18nProvider>{children}</I18nProvider>,
    });
    const week = result.current.tValue("calendar.weekdays_initials");
    expect(Array.isArray(week)).toBe(true);
    expect(week).toHaveLength(7);
  });
});
