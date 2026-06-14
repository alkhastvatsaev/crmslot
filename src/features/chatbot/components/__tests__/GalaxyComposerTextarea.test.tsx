import { createRef } from "react";
import { fireEvent, screen } from "@testing-library/react";
import { render } from "@/test-utils/render";
import GalaxyComposerTextarea from "@/features/chatbot/components/GalaxyComposerTextarea";

describe("GalaxyComposerTextarea", () => {
  it("shows centered fake caret when focused and empty", () => {
    const inputRef = createRef<HTMLTextAreaElement>();
    render(
      <div className="galaxy-button-container chatbot-galaxy-composer">
        <GalaxyComposerTextarea
          inputRef={inputRef}
          testId="galaxy-input"
          ariaLabel="Message"
          value=""
          onChange={jest.fn()}
        />
      </div>
    );

    expect(screen.queryByTestId("galaxy-input-fake-caret")).not.toBeInTheDocument();
    fireEvent.focus(screen.getByTestId("galaxy-input"));
    expect(screen.getByTestId("galaxy-input-fake-caret")).toBeInTheDocument();
  });

  it("hides fake caret once the user types", () => {
    const inputRef = createRef<HTMLTextAreaElement>();
    const onChange = jest.fn();
    const { rerender } = render(
      <div className="galaxy-button-container chatbot-galaxy-composer">
        <GalaxyComposerTextarea
          inputRef={inputRef}
          testId="galaxy-input"
          ariaLabel="Message"
          value=""
          onChange={onChange}
        />
      </div>
    );

    fireEvent.focus(screen.getByTestId("galaxy-input"));
    expect(screen.getByTestId("galaxy-input-fake-caret")).toBeInTheDocument();

    rerender(
      <div className="galaxy-button-container chatbot-galaxy-composer">
        <GalaxyComposerTextarea
          inputRef={inputRef}
          testId="galaxy-input"
          ariaLabel="Message"
          value="a"
          onChange={onChange}
        />
      </div>
    );
    expect(screen.queryByTestId("galaxy-input-fake-caret")).not.toBeInTheDocument();
  });
});
