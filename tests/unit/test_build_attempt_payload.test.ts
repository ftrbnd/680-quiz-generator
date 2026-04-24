// @vitest-environment node
import { describe, it, expect } from "vitest";
import { buildAttemptPayload } from "@/lib/quiz/build_attempt_payload";
import type { QuizQuestion } from "@/types/quiz";

const questions: QuizQuestion[] = [
  {
    id: "q1",
    quizId: "z1",
    body: "One",
    correctAnswer: "a",
    hasLatex: false,
    orderIndex: 0,
  },
  {
    id: "q2",
    quizId: "z1",
    body: "Two",
    correctAnswer: "b",
    hasLatex: false,
    orderIndex: 1,
  },
];

describe("buildAttemptPayload", () => {
  it("maps_question_ids_and_defaults_missing_responses_to_empty_string", () => {
    const payload = buildAttemptPayload(questions, { q1: "x" });
    expect(payload).toEqual([
      { questionId: "q1", response: "x" },
      { questionId: "q2", response: "" },
    ]);
  });
});
