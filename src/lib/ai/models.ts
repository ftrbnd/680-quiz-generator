import { anthropic } from "@ai-sdk/anthropic";
import type { QuizType } from "@/types/quiz";

const ADVANCED_QUIZ_TYPES: QuizType[] = ["READING_COMPREHENSION"];
const ADVANCED_QUESTION_THRESHOLD = 30;

export const DEFAULT_MODEL_ID = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";
export const ADVANCED_MODEL_ID = "claude-opus-4-7";
export const MAX_RETRIES = 3;

export function resolveModelId({
  quizType,
  questionCount,
}: {
  quizType: QuizType;
  questionCount: number;
}): string {
  const useAdvanced =
    ADVANCED_QUIZ_TYPES.includes(quizType) || questionCount > ADVANCED_QUESTION_THRESHOLD;
  return useAdvanced ? ADVANCED_MODEL_ID : DEFAULT_MODEL_ID;
}

export function selectModel({ quizType, questionCount }: { quizType: QuizType; questionCount: number }) {
  return anthropic(resolveModelId({ quizType, questionCount }));
}
