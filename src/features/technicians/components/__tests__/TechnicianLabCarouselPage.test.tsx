import { screen } from "@testing-library/react";
import { render } from "@/test-utils/render";
import TechnicianLabCarouselPage from "@/features/technicians/components/TechnicianLabCarouselPage";
import { TECHNICIAN_LAB_SLOT_INDEX } from "@/features/technicians/technicianLabConstants";

describe("TechnicianLabCarouselPage", () => {
  it("embeds the /technician route in an iframe on carousel page 6", () => {
    render(<TechnicianLabCarouselPage slotIndex={TECHNICIAN_LAB_SLOT_INDEX} />, { pageCount: 7 });
    const iframe = screen.getByTestId("technician-lab-iframe");
    expect(iframe).toHaveAttribute("src", "/technician");
    expect(iframe).toHaveAttribute("title", "/technician");
  });
});
