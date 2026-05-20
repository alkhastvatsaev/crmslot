import { isServiceDueSoon, isServiceOverdue, type ClientEquipment } from "../types";

const base: ClientEquipment = {
  id: "eq1",
  companyId: "c1",
  clientId: "client1",
  label: "Chaudière principale",
  status: "active",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

describe("isServiceOverdue", () => {
  it("returns true when nextServiceDate is in the past", () => {
    expect(isServiceOverdue({ ...base, nextServiceDate: "2020-01-01" })).toBe(true);
  });

  it("returns false when nextServiceDate is in the future", () => {
    const future = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    expect(isServiceOverdue({ ...base, nextServiceDate: future })).toBe(false);
  });

  it("returns false when no nextServiceDate", () => {
    expect(isServiceOverdue({ ...base })).toBe(false);
  });
});

describe("isServiceDueSoon", () => {
  it("returns true when service is within 30 days", () => {
    const soon = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    expect(isServiceDueSoon({ ...base, nextServiceDate: soon })).toBe(true);
  });

  it("returns false when service is far away", () => {
    const far = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    expect(isServiceDueSoon({ ...base, nextServiceDate: far })).toBe(false);
  });

  it("returns false when overdue", () => {
    expect(isServiceDueSoon({ ...base, nextServiceDate: "2020-01-01" })).toBe(false);
  });

  it("respects custom withinDays", () => {
    const in45days = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    expect(isServiceDueSoon({ ...base, nextServiceDate: in45days }, 60)).toBe(true);
    expect(isServiceDueSoon({ ...base, nextServiceDate: in45days }, 30)).toBe(false);
  });
});
