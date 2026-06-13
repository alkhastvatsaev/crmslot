import { fireEvent, screen } from "@testing-library/react";
import { render } from "@/test-utils/render";
import { createRef } from "react";
import {
  GalaxyComposerNewButton,
  GalaxyComposerSendButton,
  galaxyComposerFieldMouseDown,
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

  it("focuses textarea when clicking the galaxy field shell", () => {
    const inputRef = createRef<HTMLTextAreaElement>();
    render(<textarea ref={inputRef} data-testid="galaxy-input" />);
    const focusSpy = jest.spyOn(inputRef.current!, "focus");
    const selectSpy = jest.spyOn(inputRef.current!, "setSelectionRange");
    const shell = document.createElement("div");

    galaxyComposerFieldMouseDown(
      { target: shell, preventDefault: jest.fn() } as unknown as React.MouseEvent,
      inputRef,
      false
    );

    expect(focusSpy).toHaveBeenCalled();
    expect(selectSpy).toHaveBeenCalledWith(0, 0);
  });
});
