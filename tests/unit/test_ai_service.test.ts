// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const generateObjectMock = vi.hoisted(() => vi.fn());

vi.mock("ai", () => ({
  generateObject: (...args: unknown[]) => generateObjectMock(...args),
}));

vi.mock("@/lib/ai/models", () => ({
  selectModel: vi.fn(() => ({}) as never),
  MAX_RETRIES: 3,
}));

import {
  generateQuestions,
  GenerationFailedError,
  QuotaExceededError,
} from "@/services/ai_service";
import type { QuizConfig } from "@/types/quiz";

const config: QuizConfig = {
  questionCount: 2,
  quizType: "MULTIPLE_CHOICE",
  difficulty: "EASY",
};

describe("generateQuestions", () => {
  beforeEach(() => {
    generateObjectMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("maps_order_index_from_generateObject", async () => {
    generateObjectMock.mockResolvedValue({
      object: {
        questions: [
          { body: "Q1", correctAnswer: "A", hasLatex: false },
          { body: "Q2", correctAnswer: "B", hasLatex: true, options: [{ label: "A", text: "x" }] },
        ],
      },
    });

    const out = await generateQuestions({ text: "study ".repeat(50), config });
    expect(out).toHaveLength(2);
    expect(out[0].orderIndex).toBe(0);
    expect(out[1].orderIndex).toBe(1);
    expect(out[1].hasLatex).toBe(true);
  });

  it("throws_generation_failed_on_non_quota_errors", async () => {
    generateObjectMock.mockRejectedValue(new Error("bad request"));
    await expect(generateQuestions({ text: "x".repeat(200), config })).rejects.toBeInstanceOf(
      GenerationFailedError
    );
  });

  it("retries_on_quota_errors_then_throws_quota_exceeded", async () => {
    const err = new Error("limit");
    (err as Error & { statusCode: number }).statusCode = 429;
    generateObjectMock.mockRejectedValue(err);

    vi.useFakeTimers();
    const p = generateQuestions({ text: "x".repeat(200), config });
    const pendingRejection = expect(p).rejects.toBeInstanceOf(QuotaExceededError);
    await vi.advanceTimersByTimeAsync(15_000);
    await pendingRejection;
    expect(generateObjectMock).toHaveBeenCalledTimes(3);
  });
});
