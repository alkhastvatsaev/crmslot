import fs from "node:fs";
import path from "node:path";
import type { ReactNode } from "react";
import { render, screen } from "@/test-utils/render";
import { DateProvider } from "@/context/DateContext";
import { DashboardPagerProvider } from "@/features/dashboard/dashboardPagerContext";
import { DashboardPageSelectorProvider } from "@/features/dashboard/DashboardPageSelectorContext";
import AdminMobileShell from "@/features/dashboard/components/AdminMobileShell";
import * as mobileFooterGalaxyVisible from "@/features/dashboard/hooks/useMobileFooterGalaxyVisible";
import { ADMIN_MOBILE_SHELL_CONTRACT } from "@/features/dashboard/adminMobileShellContract";
import { MOBILE_SHELL_SLOT_GRID_CLASS } from "@/core/ui/dashboardMobileLayout";

jest.mock("@/features/dashboard/hooks/useMobileFooterGalaxyVisible", () => ({
  useMobileFooterGalaxyVisible: jest.fn(() => false),
}));

jest.mock("@/features/auth/hooks/useCrmStaffAccountPanel", () => ({
  useCrmStaffAccountPanel: () => ({
    fields: {
      email: "admin@test.com",
      firstName: "Jean",
      lastName: "Dupont",
      companyName: "Test Co",
      roleLabel: "admin",
    },
    ready: true,
    signingOut: false,
    signOut: jest.fn(),
  }),
}));

const repoRoot = path.resolve(__dirname, "../../../../");

function renderAdminShell(children: ReactNode = <div data-testid="admin-body">Inbox</div>) {
  return render(
    <DateProvider>
      <DashboardPagerProvider pageCount={1}>
        <DashboardPageSelectorProvider>
          <AdminMobileShell dock={<span>Dock</span>}>{children}</AdminMobileShell>
        </DashboardPageSelectorProvider>
      </DashboardPagerProvider>
    </DateProvider>
  );
}

describe("adminMobileShellContract — source guards", () => {
  it.each(Object.entries(ADMIN_MOBILE_SHELL_CONTRACT.guardedSourceSnippets))(
    "preserve les invariants dans %s",
    (relativePath, snippets) => {
      const source = fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
      for (const snippet of snippets) {
        expect(source).toContain(snippet);
      }
    }
  );

  it("AdminMobileProviders n'inclut pas les bridges agent desktop", () => {
    const source = fs.readFileSync(
      path.join(repoRoot, "src/features/dashboard/AdminMobileProviders.tsx"),
      "utf8"
    );
    for (const forbidden of ADMIN_MOBILE_SHELL_CONTRACT.forbiddenProviderSnippets) {
      expect(source).not.toContain(forbidden);
    }
  });
});

describe("adminMobileShellContract — layout", () => {
  it("expose le shell admin avec header rail et footer dock", () => {
    jest.mocked(mobileFooterGalaxyVisible.useMobileFooterGalaxyVisible).mockReturnValue(true);
    renderAdminShell();
    expect(screen.getByTestId(ADMIN_MOBILE_SHELL_CONTRACT.testIds.app)).toHaveClass(
      "admin-mobile-app"
    );
    expect(screen.getByTestId(ADMIN_MOBILE_SHELL_CONTRACT.testIds.headerRail)).toBeInTheDocument();
    expect(screen.getByTestId(ADMIN_MOBILE_SHELL_CONTRACT.testIds.footer)).toBeInTheDocument();
    expect(screen.getByTestId(ADMIN_MOBILE_SHELL_CONTRACT.testIds.dock)).toHaveClass(
      MOBILE_SHELL_SLOT_GRID_CLASS
    );
    expect(screen.getByTestId("admin-body")).toBeInTheDocument();
  });
});
