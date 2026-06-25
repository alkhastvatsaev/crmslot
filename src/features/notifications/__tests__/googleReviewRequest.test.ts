import {
  buildGoogleReviewUrlFromPlaceId,
  findGoogleReviewCandidates,
  isEligibleForGoogleReviewRequest,
  parseGoogleReviewCompanyConfig,
  DEFAULT_GOOGLE_REVIEW_DELAY_HOURS,
} from "@/features/notifications/googleReviewRequest";

const baseConfig = {
  companyId: "co-1",
  enabled: true,
  reviewUrl: "https://search.google.com/local/writereview?placeid=ChIJtest",
  trigger: "paid" as const,
  delayHours: DEFAULT_GOOGLE_REVIEW_DELAY_HOURS,
};

const baseIv = {
  id: "iv-1",
  companyId: "co-1",
  status: "invoiced" as const,
  title: "Dépannage",
  clientEmail: "client@example.com",
  completedAt: "2026-06-20T10:00:00.000Z",
  paidAt: "2026-06-21T10:00:00.000Z",
  paymentStatus: "paid" as const,
  googleReviewRequestSentAt: null,
};

describe("parseGoogleReviewCompanyConfig", () => {
  it("returns null when disabled", () => {
    expect(parseGoogleReviewCompanyConfig("co-1", { googleReview: { enabled: false } })).toBeNull();
  });

  it("builds URL from placeId", () => {
    const cfg = parseGoogleReviewCompanyConfig("co-1", {
      googleReview: { enabled: true, placeId: "ChIJabcdefghij" },
    });
    expect(cfg?.reviewUrl).toContain("writereview?placeid=ChIJabcdefghij");
    expect(cfg?.delayHours).toBe(48);
    expect(cfg?.trigger).toBe("paid");
  });
});

describe("buildGoogleReviewUrlFromPlaceId", () => {
  it("encodes place id", () => {
    expect(buildGoogleReviewUrlFromPlaceId("ChIJ/test")).toContain("placeid=ChIJ%2Ftest");
  });
});

describe("isEligibleForGoogleReviewRequest", () => {
  const now = new Date("2026-06-25T12:00:00.000Z");

  it("skips when already sent", () => {
    expect(
      isEligibleForGoogleReviewRequest(
        { ...baseIv, googleReviewRequestSentAt: "2026-06-22T00:00:00.000Z" },
        baseConfig,
        now
      )
    ).toBeNull();
  });

  it("requires delay after payment for paid trigger", () => {
    expect(
      isEligibleForGoogleReviewRequest(
        { ...baseIv, paidAt: "2026-06-24T12:00:00.000Z" },
        baseConfig,
        now
      )
    ).toBeNull();
  });

  it("accepts after delay for paid trigger", () => {
    const result = isEligibleForGoogleReviewRequest(baseIv, baseConfig, now);
    expect(result?.intervention.id).toBe("iv-1");
  });

  it("uses completedAt for done trigger", () => {
    const doneConfig = { ...baseConfig, trigger: "done" as const };
    const tooSoon = isEligibleForGoogleReviewRequest(
      {
        ...baseIv,
        status: "done",
        paymentStatus: "unpaid",
        paidAt: null,
        completedAt: "2026-06-24T12:00:00.000Z",
      },
      doneConfig,
      now
    );
    expect(tooSoon).toBeNull();

    const ok = isEligibleForGoogleReviewRequest(
      {
        ...baseIv,
        status: "done",
        paymentStatus: "unpaid",
        paidAt: null,
        completedAt: "2026-06-20T10:00:00.000Z",
      },
      doneConfig,
      now
    );
    expect(ok).not.toBeNull();
  });
});

describe("findGoogleReviewCandidates", () => {
  it("filters list", () => {
    const now = new Date("2026-06-25T12:00:00.000Z");
    const list = [
      baseIv,
      { ...baseIv, id: "iv-2", googleReviewRequestSentAt: "2026-06-01T00:00:00.000Z" },
    ];
    const candidates = findGoogleReviewCandidates(list, baseConfig, now);
    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.intervention.id).toBe("iv-1");
  });
});
