import {
  isDemoTechnicianPreviewUid,
  isDemoTenantCompanyId,
} from "@/core/config/demoTenantFirestore";
import { DEMO_COMPANY_ID, DEMO_TECHNICIAN_UID } from "@/core/config/devUiPreview";

describe("demoTenantFirestore", () => {
  const originalStaging = process.env.NEXT_PUBLIC_STAGING_PREVIEW;
  const originalDisable = process.env.NEXT_PUBLIC_DISABLE_DEV_UI_PREVIEW;

  afterEach(() => {
    process.env.NEXT_PUBLIC_STAGING_PREVIEW = originalStaging;
    process.env.NEXT_PUBLIC_DISABLE_DEV_UI_PREVIEW = originalDisable;
    jest.resetModules();
  });

  it("detects demo company only when dev preview is enabled", () => {
    process.env.NEXT_PUBLIC_STAGING_PREVIEW = "true";
    process.env.NEXT_PUBLIC_DISABLE_DEV_UI_PREVIEW = "";
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- rechargement après env
    const mod =
      require("@/core/config/demoTenantFirestore") as typeof import("@/core/config/demoTenantFirestore");
    expect(mod.isDemoTenantCompanyId(DEMO_COMPANY_ID)).toBe(true);
    expect(mod.isDemoTenantCompanyId("acme-corp")).toBe(false);
    expect(mod.isDemoTenantCompanyId(null)).toBe(false);
  });

  it("ignores demo company when preview is disabled", () => {
    process.env.NEXT_PUBLIC_STAGING_PREVIEW = "";
    process.env.NEXT_PUBLIC_DISABLE_DEV_UI_PREVIEW = "true";
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- rechargement après env
    const mod =
      require("@/core/config/demoTenantFirestore") as typeof import("@/core/config/demoTenantFirestore");
    expect(mod.isDemoTenantCompanyId(DEMO_COMPANY_ID)).toBe(false);
  });

  it("detects demo technician uid in preview mode", () => {
    process.env.NEXT_PUBLIC_STAGING_PREVIEW = "true";
    process.env.NEXT_PUBLIC_DISABLE_DEV_UI_PREVIEW = "";
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- rechargement après env
    const mod =
      require("@/core/config/demoTenantFirestore") as typeof import("@/core/config/demoTenantFirestore");
    expect(mod.isDemoTechnicianPreviewUid(DEMO_TECHNICIAN_UID)).toBe(true);
    expect(mod.isDemoTechnicianPreviewUid("real-tech-uid")).toBe(false);
  });
});
