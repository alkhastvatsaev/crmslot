import { appendChatbotTrainingLog, isChatbotTrainingLogEnabled } from "@/features/chatbot/training/appendChatbotTrainingLog";
import { getAdminDb, isFirebaseAdminReady } from "@/core/config/firebase-admin";

jest.mock("@/core/config/firebase-admin", () => ({
  getAdminDb: jest.fn(),
  isFirebaseAdminReady: jest.fn(),
}));

jest.mock("firebase-admin", () => ({
  firestore: {
    FieldValue: {
      serverTimestamp: jest.fn(() => "MOCK_SERVER_TS"),
    },
  },
}));

describe("isChatbotTrainingLogEnabled", () => {
  const prev = process.env.CHATBOT_TRAINING_LOG_ENABLED;

  afterEach(() => {
    if (prev === undefined) delete process.env.CHATBOT_TRAINING_LOG_ENABLED;
    else process.env.CHATBOT_TRAINING_LOG_ENABLED = prev;
  });

  it("returns false when unset", () => {
    delete process.env.CHATBOT_TRAINING_LOG_ENABLED;
    expect(isChatbotTrainingLogEnabled()).toBe(false);
  });

  it.each(["true", "TRUE", "1", "yes", "Yes"])("returns true for %s", (v) => {
    process.env.CHATBOT_TRAINING_LOG_ENABLED = v;
    expect(isChatbotTrainingLogEnabled()).toBe(true);
  });
});

describe("appendChatbotTrainingLog", () => {
  const prev = process.env.CHATBOT_TRAINING_LOG_ENABLED;

  afterEach(() => {
    if (prev === undefined) delete process.env.CHATBOT_TRAINING_LOG_ENABLED;
    else process.env.CHATBOT_TRAINING_LOG_ENABLED = prev;
    jest.mocked(getAdminDb).mockReset();
    jest.mocked(isFirebaseAdminReady).mockReset();
  });

  it("no-ops when CHATBOT_TRAINING_LOG_ENABLED is off", async () => {
    delete process.env.CHATBOT_TRAINING_LOG_ENABLED;
    const mockAdd = jest.fn();
    jest.mocked(getAdminDb).mockReturnValue({
      collection: () => ({
        doc: () => ({
          collection: () => ({ add: mockAdd }),
        }),
      }),
    } as never);
    jest.mocked(isFirebaseAdminReady).mockReturnValue(true);

    await appendChatbotTrainingLog({
      companyId: "co-1",
      actorUid: "u1",
      modelName: "gpt-4o-mini",
      conversationId: "conv-1",
      turn: { userMessage: "hi", assistantMessage: "yo", hadToolRounds: false },
    });

    expect(mockAdd).not.toHaveBeenCalled();
    expect(getAdminDb).not.toHaveBeenCalled();
  });

  it("no-ops when Firebase Admin is not ready", async () => {
    process.env.CHATBOT_TRAINING_LOG_ENABLED = "true";
    const mockAdd = jest.fn();
    jest.mocked(getAdminDb).mockReturnValue({
      collection: () => ({
        doc: () => ({
          collection: () => ({ add: mockAdd }),
        }),
      }),
    } as never);
    jest.mocked(isFirebaseAdminReady).mockReturnValue(false);

    await appendChatbotTrainingLog({
      companyId: "co-1",
      actorUid: "u1",
      modelName: "gpt-4o-mini",
      conversationId: null,
      turn: { userMessage: "hi", assistantMessage: "yo", hadToolRounds: true },
    });

    expect(mockAdd).not.toHaveBeenCalled();
    expect(getAdminDb).not.toHaveBeenCalled();
  });

  it("writes companies/{id}/chatbot_training_logs when enabled and admin ready", async () => {
    process.env.CHATBOT_TRAINING_LOG_ENABLED = "true";
    const mockAdd = jest.fn(async () => undefined);
    const companiesDoc = jest.fn(() => ({
      collection: (sub: string) => {
        expect(sub).toBe("chatbot_training_logs");
        return { add: mockAdd };
      },
    }));
    jest.mocked(getAdminDb).mockReturnValue({
      collection: (name: string) => {
        expect(name).toBe("companies");
        return { doc: companiesDoc };
      },
    } as never);
    jest.mocked(isFirebaseAdminReady).mockReturnValue(true);

    await appendChatbotTrainingLog({
      companyId: "co-acme",
      actorUid: "uid-42",
      modelName: "gpt-4o",
      conversationId: " thread-1 ",
      turn: { userMessage: "Question ?", assistantMessage: "Réponse.", hadToolRounds: true },
    });

    expect(companiesDoc).toHaveBeenCalledWith("co-acme");
    expect(mockAdd).toHaveBeenCalledTimes(1);
    const payload = mockAdd.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.actorUid).toBe("uid-42");
    expect(payload.modelName).toBe("gpt-4o");
    expect(payload.conversationId).toBe("thread-1");
    expect(payload.userMessage).toBe("Question ?");
    expect(payload.assistantMessage).toBe("Réponse.");
    expect(payload.hadToolRounds).toBe(true);
    expect(payload.source).toBe("belgmap_openai_chatbot");
    expect(payload.createdAt).toBe("MOCK_SERVER_TS");
  });

  it("skips add when user or assistant text is empty after trim", async () => {
    process.env.CHATBOT_TRAINING_LOG_ENABLED = "true";
    const mockAdd = jest.fn();
    jest.mocked(getAdminDb).mockReturnValue({
      collection: () => ({
        doc: () => ({
          collection: () => ({ add: mockAdd }),
        }),
      }),
    } as never);
    jest.mocked(isFirebaseAdminReady).mockReturnValue(true);

    await appendChatbotTrainingLog({
      companyId: "co-1",
      actorUid: "u1",
      modelName: "m",
      conversationId: null,
      turn: { userMessage: "   ", assistantMessage: "ok", hadToolRounds: false },
    });
    expect(mockAdd).not.toHaveBeenCalled();

    await appendChatbotTrainingLog({
      companyId: "co-1",
      actorUid: "u1",
      modelName: "m",
      conversationId: null,
      turn: { userMessage: "x", assistantMessage: "", hadToolRounds: false },
    });
    expect(mockAdd).not.toHaveBeenCalled();
  });

  it("swallows Firestore errors without throwing", async () => {
    process.env.CHATBOT_TRAINING_LOG_ENABLED = "true";
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.mocked(getAdminDb).mockReturnValue({
      collection: () => ({
        doc: () => ({
          collection: () => ({
            add: jest.fn(async () => {
              throw new Error("firestore down");
            }),
          }),
        }),
      }),
    } as never);
    jest.mocked(isFirebaseAdminReady).mockReturnValue(true);

    await expect(
      appendChatbotTrainingLog({
        companyId: "co-1",
        actorUid: "u1",
        modelName: "m",
        conversationId: null,
        turn: { userMessage: "a", assistantMessage: "b", hadToolRounds: false },
      }),
    ).resolves.toBeUndefined();

    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });
});
