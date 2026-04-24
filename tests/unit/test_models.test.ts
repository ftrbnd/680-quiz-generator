// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const anthropicMock = vi.hoisted(() => vi.fn((modelId: string) => ({ modelId })));

vi.mock("@ai-sdk/anthropic", () => ({
  anthropic: (modelId: string) => anthropicMock(modelId),
}));

import {
  ADVANCED_MODEL_ID,
  DEFAULT_MODEL_ID,
  resolveModelId,
  selectModel,
} from "@/lib/ai/models";
import type { QuizType } from "@/types/quiz";

describe("resolveModelId", () => {
  it("uses_default_model_for_standard_quiz_and_count_at_threshold", () => {
    expect(resolveModelId({ quizType: "MULTIPLE_CHOICE", questionCount: 30 })).toBe(DEFAULT_MODEL_ID);
    expect(resolveModelId({ quizType: "SHORT_ANSWER", questionCount: 10 })).toBe(DEFAULT_MODEL_ID);
  });

  it("uses_advanced_model_for_reading_comprehension", () => {
    expect(resolveModelId({ quizType: "READING_COMPREHENSION", questionCount: 1 })).toBe(ADVANCED_MODEL_ID);
  });

  it("uses_advanced_model_when_question_count_exceeds_threshold", () => {
    expect(resolveModelId({ quizType: "MULTIPLE_CHOICE", questionCount: 31 })).toBe(ADVANCED_MODEL_ID);
  });
});

describe("selectModel", () => {
  beforeEach(() => {
    anthropicMock.mockClear();
  });

  it("calls_anthropic_with_resolved_model_id", () => {
    const m = selectModel({ quizType: "MULTIPLE_CHOICE" as QuizType, questionCount: 5 });
    expect(anthropicMock).toHaveBeenCalledWith(DEFAULT_MODEL_ID);
    expect(m).toEqual({ modelId: DEFAULT_MODEL_ID });

    selectModel({ quizType: "READING_COMPREHENSION", questionCount: 2 });
    expect(anthropicMock).toHaveBeenLastCalledWith(ADVANCED_MODEL_ID);
  });
});
