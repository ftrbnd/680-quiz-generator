import type { AttemptFeedbackItem } from "@/lib/quiz/grade_responses";

export type Flashcard = {
  questionId: string;
  front: string;
  back: string;
  hasLatex: boolean;
};

export function buildFlashcardsFromWrongAnswers(
  feedback: AttemptFeedbackItem[]
): Flashcard[] {
  return feedback
    .filter((item) => !item.isCorrect)
    .map((item) => {
      const { question } = item;
      let back = question.correctAnswer;

      if (question.options) {
        const correctOption = question.options.find(
          (opt) => opt.label === question.correctAnswer
        );
        if (correctOption) {
          back = `${correctOption.label}. ${correctOption.text}`;
        }
      }

      return {
        questionId: question.id,
        front: question.body,
        back,
        hasLatex: question.hasLatex,
      };
    });
}
