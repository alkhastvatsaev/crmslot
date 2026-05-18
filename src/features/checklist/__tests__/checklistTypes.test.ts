import {
  buildDefaultChecklist,
  isChecklistComplete,
  checklistProgress,
  DEFAULT_CHECKLIST_ITEMS,
} from "../types";

const base = buildDefaultChecklist("int-1", "co-1");

describe("buildDefaultChecklist", () => {
  it("creates items from defaults", () => {
    expect(base.items).toHaveLength(DEFAULT_CHECKLIST_ITEMS.length);
    expect(base.items.every((i) => i.checked === false)).toBe(true);
  });

  it("sets correct intervention and company ids", () => {
    expect(base.interventionId).toBe("int-1");
    expect(base.companyId).toBe("co-1");
  });
});

describe("isChecklistComplete", () => {
  it("returns false when required items not checked", () => {
    expect(isChecklistComplete({ ...base, id: "cl-1", createdAt: "", updatedAt: "" })).toBe(false);
  });

  it("returns true when all required items checked", () => {
    const allRequired = {
      ...base,
      id: "cl-1",
      createdAt: "",
      updatedAt: "",
      items: base.items.map((i) => ({ ...i, checked: i.required ? true : i.checked })),
    };
    expect(isChecklistComplete(allRequired)).toBe(true);
  });
});

describe("checklistProgress", () => {
  it("returns 0/N initially", () => {
    const cl = { ...base, id: "cl-1", createdAt: "", updatedAt: "" };
    const p = checklistProgress(cl);
    expect(p.done).toBe(0);
    expect(p.total).toBe(DEFAULT_CHECKLIST_ITEMS.length);
  });

  it("counts checked items", () => {
    const cl = {
      ...base,
      id: "cl-1",
      createdAt: "",
      updatedAt: "",
      items: base.items.map((item, i) => ({ ...item, checked: i < 3 })),
    };
    expect(checklistProgress(cl).done).toBe(3);
  });
});
