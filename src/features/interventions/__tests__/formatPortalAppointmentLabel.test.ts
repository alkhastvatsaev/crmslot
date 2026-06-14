import {
  formatPortalAppointmentLabel,
  mapI18nLanguageToLocale,
} from "@/features/interventions/technicianSchedule";

describe("formatPortalAppointmentLabel", () => {
  it("formate un rendez-vous en français lisible", () => {
    expect(formatPortalAppointmentLabel("2026-06-08", "10:00", "fr-BE")).toBe(
      "Lundi 8 Juin à 10:00"
    );
  });

  it("formate les minutes en français", () => {
    expect(formatPortalAppointmentLabel("2026-06-08", "10:30", "fr-BE")).toBe(
      "Lundi 8 Juin à 10:30"
    );
  });

  it("formate sans heure", () => {
    expect(formatPortalAppointmentLabel("2026-06-08", null, "fr-BE")).toBe("Lundi 8 Juin");
  });

  it("formate en anglais", () => {
    expect(formatPortalAppointmentLabel("2026-06-08", "10:00", "en-GB")).toMatch(
      /Monday, 8 June at 10/
    );
  });

  it("mappe la langue i18n vers une locale", () => {
    expect(mapI18nLanguageToLocale("fr")).toBe("fr-BE");
    expect(mapI18nLanguageToLocale("en")).toBe("en-GB");
    expect(mapI18nLanguageToLocale("nl")).toBe("nl-BE");
  });
});
