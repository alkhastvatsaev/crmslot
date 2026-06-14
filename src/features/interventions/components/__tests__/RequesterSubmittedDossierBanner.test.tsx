import { render, screen } from "@/test-utils/render";
import RequesterSubmittedDossierBanner from "../RequesterSubmittedDossierBanner";

describe("RequesterSubmittedDossierBanner", () => {
  it("affiche le numéro de dossier formaté", () => {
    render(<RequesterSubmittedDossierBanner dossierNumber="AB12 CD34" />);

    expect(screen.getByTestId("requester-submitted-dossier-banner")).toBeInTheDocument();
    expect(screen.getByTestId("requester-submitted-dossier-number")).toHaveTextContent("AB12 CD34");
  });
});
