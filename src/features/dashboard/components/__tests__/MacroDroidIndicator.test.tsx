import { useFeatureFlag } from "@/core/useFeatureFlags";

jest.mock("@/core/useFeatureFlags", () => ({
  useFeatureFlag: jest.fn(() => true),
}));

const mockUseFeatureFlag = useFeatureFlag as jest.MockedFunction<typeof useFeatureFlag>;

import { screen } from "@testing-library/react";
import { render } from "@/test-utils/render";
import MacroDroidIndicator from "@/features/dashboard/components/MacroDroidIndicator";
import { mockState } from "@/test-utils/mockState";
import { onSnapshot } from "firebase/firestore";

const mockOnSnapshot = onSnapshot as jest.MockedFunction<typeof onSnapshot>;

describe("MacroDroidIndicator", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockState.reset();
    mockUseFeatureFlag.mockReturnValue(true);
  });

  it("ne souscrit pas Firestore quand non authentifié", () => {
    mockState.currentUser = null;
    render(<MacroDroidIndicator />);
    expect(mockOnSnapshot).not.toHaveBeenCalled();
  });

  it("souscrit Firestore quand authentifié", () => {
    render(<MacroDroidIndicator />);
    expect(mockOnSnapshot).toHaveBeenCalledTimes(1);
  });

  it("affiche le panneau quand le doc macrodroid est ready avec transcript", () => {
    const processedKey = "2026-06-13T10:00:00Z";
    mockState.firestoreDocs["ai_status/macrodroid"] = {
      status: "ready",
      transcript: "Transcription test macrodroid",
      lastProcessedAt: processedKey,
    };

    render(<MacroDroidIndicator />);
    expect(screen.getByText(/Transcription test macrodroid/)).toBeInTheDocument();
  });

  it("ne souscrit pas Firestore quand dispatchVoice est désactivé", () => {
    mockUseFeatureFlag.mockReturnValue(false);
    render(<MacroDroidIndicator />);
    expect(mockOnSnapshot).not.toHaveBeenCalled();
  });

  it("n'affiche rien si le statut est waiting", () => {
    mockState.firestoreDocs["ai_status/macrodroid"] = { status: "waiting", transcript: "ignored" };

    render(<MacroDroidIndicator />);
    expect(screen.queryByText(/ignored/)).not.toBeInTheDocument();
  });
});
