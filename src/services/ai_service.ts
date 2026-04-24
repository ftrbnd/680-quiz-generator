import { generateObject } from "ai";
import { selectModel, MAX_RETRIES } from "@/lib/ai/models";
import { QuizOutputSchema, type GeneratedQuestion } from "@/lib/ai/quiz_output_schema";
import { SYSTEM_PROMPT, buildUserPrompt } from "@/lib/ai/prompt_builder";
import type { QuizConfig } from "@/types/quiz";

export { QuizOutputSchema, QuestionSchema, QuestionOptionSchema } from "@/lib/ai/quiz_output_schema";
export type { GeneratedQuestion } from "@/lib/ai/quiz_output_schema";

export class GenerationFailedError extends Error {
  readonly code = "GENERATION_FAILED";
}
export class QuotaExceededError extends Error {
  readonly code = "QUOTA_EXCEEDED";
}

export async function generateQuestions({
  text,
  config,
}: {
  text: string;
  config: QuizConfig;
}): Promise<GeneratedQuestion[]> {
  const model = selectModel({ quizType: config.quizType, questionCount: config.questionCount });
  const userPrompt = buildUserPrompt({ text, config });

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const { object } = await generateObject({
        model,
        schema: QuizOutputSchema,
        system: SYSTEM_PROMPT,
        prompt: userPrompt,
        providerOptions: {
          anthropic: {
            // Cache the static system prompt across repeated calls with same config
            cacheControl: { type: "ephemeral" },
          },
        },
      });

      return object.questions.map((q, index) => ({ ...q, orderIndex: index }));
    } catch (err) {
      const status = err instanceof Error && "statusCode" in err
        ? (err as { statusCode: number }).statusCode
        : null;

      if (status === 429 || status === 529) {
        lastError = new QuotaExceededError("Claude API rate limit reached. Please try again shortly.");
        await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
        continue;
      }

      throw new GenerationFailedError(
        `Quiz generation failed: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  throw lastError ?? new GenerationFailedError("Quiz generation failed after maximum retries");
}
