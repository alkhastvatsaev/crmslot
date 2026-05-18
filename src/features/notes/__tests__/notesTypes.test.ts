import {
  NOTE_VISIBILITY_LABELS,
  NOTE_VISIBILITY_STYLES,
  type NoteVisibility,
} from "../types";

describe("NOTE_VISIBILITY_LABELS", () => {
  const visibilities: NoteVisibility[] = ["private", "team", "client"];

  it("has a label for each visibility", () => {
    for (const v of visibilities) {
      expect(NOTE_VISIBILITY_LABELS[v]).toBeTruthy();
    }
  });

  it("private is labelled Privée", () => {
    expect(NOTE_VISIBILITY_LABELS.private).toBe("Privée");
  });

  it("team is labelled Équipe", () => {
    expect(NOTE_VISIBILITY_LABELS.team).toBe("Équipe");
  });
});

describe("NOTE_VISIBILITY_STYLES", () => {
  it("private style uses slate color", () => {
    expect(NOTE_VISIBILITY_STYLES.private).toContain("slate");
  });

  it("team style uses blue color", () => {
    expect(NOTE_VISIBILITY_STYLES.team).toContain("blue");
  });

  it("client style uses emerald color", () => {
    expect(NOTE_VISIBILITY_STYLES.client).toContain("emerald");
  });
});
