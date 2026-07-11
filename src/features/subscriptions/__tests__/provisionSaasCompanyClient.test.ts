/** @jest-environment jsdom */

import { isSaasSignupFlow } from "@/features/subscriptions/provisionSaasCompanyClient";

describe("provisionSaasCompanyClient", () => {
  it("detects saas signup when pending plan in sessionStorage", () => {
    sessionStorage.setItem("crmslot_pending_plan", "team");
    expect(isSaasSignupFlow()).toBe(true);
    sessionStorage.removeItem("crmslot_pending_plan");
    expect(isSaasSignupFlow()).toBe(false);
  });
});
