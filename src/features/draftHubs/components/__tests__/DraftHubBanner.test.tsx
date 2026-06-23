import React from "react";
import { render, screen } from "@testing-library/react";
import DraftHubBanner from "@/features/draftHubs/components/DraftHubBanner";

describe("DraftHubBanner", () => {
  it("renders title and hint under the 'Brouillon' label", () => {
    render(<DraftHubBanner title="Hub démo" hint="Page concept non finalisée" />);
    expect(screen.getByTestId("draft-hub-banner")).toBeInTheDocument();
    expect(screen.getByText(/Brouillon · Hub démo/)).toBeInTheDocument();
    expect(screen.getByText("Page concept non finalisée")).toBeInTheDocument();
  });

  it("honours the optional testId prop", () => {
    render(<DraftHubBanner title="X" hint="Y" testId="custom-banner" />);
    expect(screen.getByTestId("custom-banner")).toBeInTheDocument();
  });
});
