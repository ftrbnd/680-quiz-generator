// @vitest-environment node
import { describe, it, expect } from "vitest";
import { QuizOutputSchema } from "@/lib/ai/quiz_output_schema";

describe("QuizOutputSchema", () => {
  it("accepts_minimal_valid_output", () => {
    const parsed = QuizOutputSchema.safeParse({
      questions: [
        {
          body: "What is 2+2?",
          correctAnswer: "4",
          hasLatex: false,
        },
      ],
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects_invalid_questions", () => {
    expect(QuizOutputSchema.safeParse({ questions: [] }).success).toBe(true);
    expect(QuizOutputSchema.safeParse({ questions: [{ body: "x" }] }).success).toBe(false);
    expect(QuizOutputSchema.safeParse({}).success).toBe(false);
  });
});
