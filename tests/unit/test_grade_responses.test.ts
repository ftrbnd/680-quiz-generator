// @vitest-environment node
import { describe, it, expect } from "vitest";
import {
  answersEqual,
  buildAttemptFeedback,
  gradeResponses,
  type QuestionForGrading,
} from "@/lib/quiz/grade_responses";

function q(partial: Partial<QuestionForGrading> & Pick<QuestionForGrading, "id" | "correctAnswer">): QuestionForGrading {
  return {
    quizId: "qz1",
    body: "Q?",
    options: null,
    hasLatex: false,
    orderIndex: 0,
    ...partial,
  };
}

describe("answersEqual", () => {
  it("compares_trimmed_case_insensitive", () => {
    expect(answersEqual("  Foo  ", "foo")).toBe(true);
    expect(answersEqual("A", "b")).toBe(false);
  });
});

describe("gradeResponses", () => {
  const questions: QuestionForGrading[] = [
    q({ id: "q1", correctAnswer: "Alpha", orderIndex: 0 }),
    q({ id: "q2", correctAnswer: "Beta", orderIndex: 1 }),
  ];

  it("scores_multiple_responses", () => {
    const { scoredAnswers, score, totalQuestions, questionMap } = gradeResponses(questions, [
      { questionId: "q1", response: "  alpha " },
      { questionId: "q2", response: "wrong" },
    ]);
    expect(totalQuestions).toBe(2);
    expect(score).toBe(0.5);
    expect(scoredAnswers[0].isCorrect).toBe(true);
    expect(scoredAnswers[1].isCorrect).toBe(false);
    expect(questionMap.get("q1")?.correctAnswer).toBe("Alpha");
  });

  it("throws_on_unknown_question_id", () => {
    expect(() =>
      gradeResponses(questions, [{ questionId: "missing", response: "x" }])
    ).toThrow("Unknown question ID: missing");
  });

  it("empty_responses_yields_nan_score_matching_prior_behavior", () => {
    const { score, totalQuestions } = gradeResponses(questions, []);
    expect(totalQuestions).toBe(0);
    expect(score).toBeNaN();
  });
});

describe("buildAttemptFeedback", () => {
  it("maps_scored_rows_to_feedback", () => {
    const questions: QuestionForGrading[] = [
      q({
        id: "q1",
        correctAnswer: "ok",
        body: "Stem",
        orderIndex: 2,
        options: [{ label: "A", text: "t" }],
      }),
    ];
    const { scoredAnswers, questionMap } = gradeResponses(questions, [
      { questionId: "q1", response: "ok" },
    ]);
    const feedback = buildAttemptFeedback(scoredAnswers, questionMap);
    expect(feedback).toHaveLength(1);
    expect(feedback[0].question.body).toBe("Stem");
    expect(feedback[0].question.options).toEqual([{ label: "A", text: "t" }]);
    expect(feedback[0].isCorrect).toBe(true);
  });
});
