import { requestDefaultCompanyMembership } from "@/features/auth/requestDefaultCompanyMembership";

describe("requestDefaultCompanyMembership", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it("returns company id when join-default succeeds", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, companyId: "co-abc" }),
    });
    const user = { getIdToken: jest.fn().mockResolvedValueOnce("t1").mockResolvedValueOnce("t2") };

    const result = await requestDefaultCompanyMembership(user as never);

    expect(result).toEqual({ ok: true, companyId: "co-abc" });
    expect(user.getIdToken).toHaveBeenCalledWith(true);
    expect(global.fetch).toHaveBeenCalledWith("/api/company/join-default", {
      method: "POST",
      headers: {
        Authorization: "Bearer t1",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ staffKind: "admin" }),
    });
  });

  it("sends technician profile when staffKind is technician", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, companyId: "co-abc" }),
    });
    const user = {
      email: "tech@example.com",
      getIdToken: jest.fn().mockResolvedValueOnce("t1").mockResolvedValueOnce("t2"),
    };

    const result = await requestDefaultCompanyMembership(user as never, {
      staffKind: "technician",
      firstName: "Jean",
      lastName: "Martin",
      email: "tech@example.com",
    });

    expect(result).toEqual({ ok: true, companyId: "co-abc" });
    expect(global.fetch).toHaveBeenCalledWith("/api/company/join-default", {
      method: "POST",
      headers: {
        Authorization: "Bearer t1",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        staffKind: "technician",
        firstName: "Jean",
        lastName: "Martin",
        email: "tech@example.com",
      }),
    });
  });

  it("returns server error message on failure", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ ok: false, error: "Société introuvable." }),
    });
    const user = { getIdToken: jest.fn().mockResolvedValue("t1") };

    const result = await requestDefaultCompanyMembership(user as never);

    expect(result).toEqual({ ok: false, error: "Société introuvable." });
  });
});
