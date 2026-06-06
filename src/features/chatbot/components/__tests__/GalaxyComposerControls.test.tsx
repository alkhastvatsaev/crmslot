import { fireEvent, screen } from "@testing-library/react";
import { render } from "@/test-utils/render";
import {
  GalaxyComposerNewButton,
  GalaxyComposerSendButton,
} from "@/features/chatbot/components/GalaxyComposerControls";

describe("GalaxyComposerControls", () => {
  it("renders plus and send without title tooltip", () => {
    const onNew = jest.fn();
    const onSend = jest.fn();
    render(
      <div className="galaxy-button-container chatbot-galaxy-composer">
        <GalaxyComposerNewButton
          testId="galaxy-new"
          ariaLabel="Nouvelle conversation"
          onClick={onNew}
        />
        <GalaxyComposerSendButton testId="galaxy-send" ariaLabel="Envoyer" onClick={onSend} />
      </div>
    );

    const newBtn = screen.getByTestId("galaxy-new");
    expect(newBtn).toHaveClass("chatbot-galaxy-composer-action--new");
    expect(newBtn).not.toHaveAttribute("title");
    expect(newBtn).toHaveAttribute("aria-label", "Nouvelle conversation");

    fireEvent.click(newBtn);
    expect(onNew).toHaveBeenCalledTimes(1);

    const sendBtn = screen.getByTestId("galaxy-send");
    expect(sendBtn).not.toHaveAttribute("title");
    fireEvent.click(sendBtn);
    expect(onSend).toHaveBeenCalledTimes(1);
  });
});
