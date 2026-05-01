// @vitest-environment node
import { describe, it, expect } from "vitest";
import { buildFlashcardsFromWrongAnswers } from "@/lib/quiz/build_flashcards";
import type { AttemptFeedbackItem } from "@/lib/quiz/grade_responses";
import type { QuizQuestion } from "@/types/quiz";

function makeQuestion(
  partial: Partial<QuizQuestion> & Pick<QuizQuestion, "id" | "correctAnswer">
): QuizQuestion {
  return {
    quizId: "qz1",
    body: "What is the answer?",
    options: undefined,
    hasLatex: false,
    orderIndex: 0,
    ...partial,
  };
}

function makeFeedback(
  question: QuizQuestion,
  studentResponse: string,
  isCorrect: boolean
): AttemptFeedbackItem {
  return { question, studentResponse, isCorrect };
}

describe("buildFlashcardsFromWrongAnswers", () => {
  it("returns_empty_array_for_empty_feedback", () => {
    expect(buildFlashcardsFromWrongAnswers([])).toEqual([]);
  });

  it("returns_empty_array_when_all_answers_are_correct", () => {
    const feedback: AttemptFeedbackItem[] = [
      makeFeedback(makeQuestion({ id: "q1", correctAnswer: "Paris" }), "Paris", true),
      makeFeedback(makeQuestion({ id: "q2", correctAnswer: "Berlin" }), "Berlin", true),
    ];
    expect(buildFlashcardsFromWrongAnswers(feedback)).toEqual([]);
  });

  it("maps_question_body_to_flashcard_front", () => {
    const question = makeQuestion({
      id: "q1",
      body: "What is the capital of France?",
      correctAnswer: "Paris",
    });
    const [card] = buildFlashcardsFromWrongAnswers([makeFeedback(question, "London", false)]);
    expect(card.front).toBe("What is the capital of France?");
  });

  it("maps_correct_answer_to_back_for_short_answer", () => {
    const question = makeQuestion({ id: "q1", correctAnswer: "Paris" });
    const [card] = buildFlashcardsFromWrongAnswers([makeFeedback(question, "London", false)]);
    expect(card.back).toBe("Paris");
  });

  it("maps_correct_answer_to_back_for_fill_in_the_blank", () => {
    const question = makeQuestion({
      id: "q1",
      body: "The speed of light is ___ km/s.",
      correctAnswer: "300,000",
    });
    const [card] = buildFlashcardsFromWrongAnswers([makeFeedback(question, "200,000", false)]);
    expect(card.back).toBe("300,000");
  });

  it("includes_option_label_and_text_in_back_for_multiple_choice", () => {
    const question = makeQuestion({
      id: "q1",
      correctAnswer: "B",
      options: [
        { label: "A", text: "London" },
        { label: "B", text: "Paris" },
        { label: "C", text: "Berlin" },
      ],
    });
    const [card] = buildFlashcardsFromWrongAnswers([makeFeedback(question, "A", false)]);
    expect(card.back).toBe("B. Paris");
  });

  it("falls_back_to_correct_answer_label_when_option_text_not_found", () => {
    const question = makeQuestion({
      id: "q1",
      correctAnswer: "D",
      options: [
        { label: "A", text: "London" },
        { label: "B", text: "Paris" },
      ],
    });
    const [card] = buildFlashcardsFromWrongAnswers([makeFeedback(question, "A", false)]);
    expect(card.back).toBe("D");
  });

  it("preserves_question_id_on_each_flashcard", () => {
    const question = makeQuestion({ id: "q-abc-123", correctAnswer: "X" });
    const [card] = buildFlashcardsFromWrongAnswers([makeFeedback(question, "Y", false)]);
    expect(card.questionId).toBe("q-abc-123");
  });

  it("excludes_correct_answers_and_includes_only_wrong", () => {
    const feedback: AttemptFeedbackItem[] = [
      makeFeedback(makeQuestion({ id: "q1", correctAnswer: "Alpha" }), "Alpha", true),
      makeFeedback(makeQuestion({ id: "q2", correctAnswer: "Beta" }), "Wrong", false),
      makeFeedback(makeQuestion({ id: "q3", correctAnswer: "Gamma" }), "Gamma", true),
      makeFeedback(makeQuestion({ id: "q4", correctAnswer: "Delta" }), "Nope", false),
    ];
    const cards = buildFlashcardsFromWrongAnswers(feedback);
    expect(cards).toHaveLength(2);
    expect(cards.map((c) => c.questionId)).toEqual(["q2", "q4"]);
  });

  it("produces_one_flashcard_per_wrong_answer", () => {
    const feedback: AttemptFeedbackItem[] = [
      makeFeedback(makeQuestion({ id: "q1", correctAnswer: "A" }), "B", false),
      makeFeedback(makeQuestion({ id: "q2", correctAnswer: "C" }), "D", false),
    ];
    expect(buildFlashcardsFromWrongAnswers(feedback)).toHaveLength(2);
  });

  it("handles_multiple_choice_with_no_options_array_as_short_answer", () => {
    const question = makeQuestion({ id: "q1", correctAnswer: "B", options: undefined });
    const [card] = buildFlashcardsFromWrongAnswers([makeFeedback(question, "A", false)]);
    expect(card.back).toBe("B");
  });
});
