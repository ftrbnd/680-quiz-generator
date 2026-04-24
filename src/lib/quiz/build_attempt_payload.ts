import type { QuizQuestion } from "@/types/quiz";

export function buildAttemptPayload(
  questions: QuizQuestion[],
  responses: Record<string, string>
): { questionId: string; response: string }[] {
  return questions.map((q) => ({
    questionId: q.id,
    response: responses[q.id] ?? "",
  }));
}
