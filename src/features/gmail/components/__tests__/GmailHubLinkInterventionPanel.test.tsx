import { screen, fireEvent, waitFor } from "@testing-library/react";
import { render } from "@/test-utils/render";
import GmailHubLinkInterventionPanel from "@/features/gmail/components/GmailHubLinkInterventionPanel";
import type { GmailLinkCandidate } from "@/features/gmail/useGmailHubLinkIntervention";

const candidates: GmailLinkCandidate[] = [
  {
    interventionId: "iv-1",
    clientName: "Dupont",
    status: "open",
    score: 40,
    reasons: ["email expéditeur = email dossier"],
  },
];

describe("GmailHubLinkInterventionPanel", () => {
  it("loads suggestions when opened", async () => {
    const onLoad = jest.fn();
    render(
      <GmailHubLinkInterventionPanel
        open
        messageId="m1"
        companyId="co-1"
        candidates={[]}
        loadingSuggestions={false}
        linking={false}
        suggestionsError={null}
        interventions={[]}
        onLoadSuggestions={onLoad}
        onLink={jest.fn()}
      />,
    );
    await waitFor(() => expect(onLoad).toHaveBeenCalledWith("m1"));
  });

  it("renders candidates and submits link", () => {
    const onLink = jest.fn();
    render(
      <GmailHubLinkInterventionPanel
        open
        messageId="m1"
        companyId="co-1"
        candidates={candidates}
        loadingSuggestions={false}
        linking={false}
        suggestionsError={null}
        interventions={[]}
        onLoadSuggestions={jest.fn()}
        onLink={onLink}
      />,
    );
    fireEvent.click(screen.getByTestId("gmail-hub-link-candidate-iv-1"));
    fireEvent.change(screen.getByTestId("gmail-hub-link-note"), {
      target: { value: "Colis reçu" },
    });
    fireEvent.click(screen.getByTestId("gmail-hub-link-submit"));
    expect(onLink).toHaveBeenCalledWith("iv-1", "Colis reçu");
  });

  it("shows message when company is missing", () => {
    render(
      <GmailHubLinkInterventionPanel
        open
        messageId="m1"
        companyId={null}
        candidates={[]}
        loadingSuggestions={false}
        linking={false}
        suggestionsError={null}
        interventions={[]}
        onLoadSuggestions={jest.fn()}
        onLink={jest.fn()}
      />,
    );
    expect(screen.getByTestId("gmail-hub-link-no-company")).toBeInTheDocument();
  });
});
