import type { QuestionOption, QuizQuestion } from "@/types/quiz";

function toQuestionOption(raw: unknown): QuestionOption[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  return raw as QuestionOption[];
}

export type QuestionForGrading = {
  id: string;
  quizId: string;
  body: string;
  options: unknown;
  correctAnswer: string;
  hasLatex: boolean;
  orderIndex: number;
};

export function answersEqual(student: string, correct: string): boolean {
  return student.trim().toLowerCase() === correct.trim().toLowerCase();
}

export function gradeResponses(
  quizQuestions: QuestionForGrading[],
  responses: { questionId: string; response: string }[]
): {
  scoredAnswers: { questionId: string; studentResponse: string; isCorrect: boolean }[];
  score: number;
  totalQuestions: number;
  questionMap: Map<string, QuestionForGrading>;
} {
  const questionMap = new Map(quizQuestions.map((q) => [q.id, q]));

  const scoredAnswers = responses.map(({ questionId, response }) => {
    const question = questionMap.get(questionId);
    if (!question) throw new Error(`Unknown question ID: ${questionId}`);
    const isCorrect = answersEqual(response, question.correctAnswer);
    return { questionId, studentResponse: response, isCorrect };
  });

  const score = scoredAnswers.filter((a) => a.isCorrect).length / scoredAnswers.length;

  return { scoredAnswers, score, totalQuestions: scoredAnswers.length, questionMap };
}

export function buildAttemptFeedback(
  scoredAnswers: { questionId: string; studentResponse: string; isCorrect: boolean }[],
  questionMap: Map<string, QuestionForGrading>
): AttemptFeedbackItem[] {
  return scoredAnswers.map((a) => {
    const q = questionMap.get(a.questionId)!;
    return {
      question: {
        id: q.id,
        quizId: q.quizId,
        body: q.body,
        options: toQuestionOption(q.options),
        correctAnswer: q.correctAnswer,
        hasLatex: q.hasLatex,
        orderIndex: q.orderIndex,
      } satisfies QuizQuestion,
      studentResponse: a.studentResponse,
      isCorrect: a.isCorrect,
    };
  });
}

export type AttemptFeedbackItem = {
  question: QuizQuestion;
  studentResponse: string;
  isCorrect: boolean;
};
