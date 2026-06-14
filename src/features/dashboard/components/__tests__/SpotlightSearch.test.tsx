import React from "react";
import { screen, fireEvent } from "@testing-library/react";
import { render } from "@/test-utils/render";
import SpotlightSearch from "../SpotlightSearch";

describe("SpotlightSearch", () => {
  it("renders trigger button", () => {
    render(<SpotlightSearch />);
    expect(screen.getByTestId("spotlight-trigger")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ouvrir la recherche" })).toBeInTheDocument();
  });

  it("opens spotlight without page navigation grid", () => {
    render(<SpotlightSearch />);
    fireEvent.click(screen.getByTestId("spotlight-trigger"));
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.queryByTestId("nav-item-0")).not.toBeInTheDocument();
    expect(screen.queryByTestId("dashboard-language-selector")).not.toBeInTheDocument();
  });

  it("closes modal when backdrop is clicked", () => {
    render(<SpotlightSearch />);
    fireEvent.click(screen.getByTestId("spotlight-trigger"));
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    const [backdrop] = document.querySelectorAll(".fixed.inset-0.bg-slate-900\\/10");
    fireEvent.click(backdrop);
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });
});
