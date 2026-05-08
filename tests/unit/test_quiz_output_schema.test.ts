import { describe, expect, it } from "vitest";
import { QuizOutputSchema } from "@/lib/ai/quiz_output_schema";

describe("QuizOutputSchema", () => {
    it("accepts_minimal_valid_output", () => {
        const parsed = QuizOutputSchema.safeParse({
            questions: [
                {
                    body: "What is the capital of France?",
                    options: [
                        { label: "A", text: "Paris" },
                        { label: "B", text: "Rome" },
                        { label: "C", text: "Madrid" },
                        { label: "D", text: "Berlin" },
                    ],
                    correctAnswer: "Paris",
                    hasLatex: false,
                    explanation: "Paris is the capital city of France.",
                },
            ],
        });

        expect(parsed.success).toBe(true);
    });

    it("accepts_valid_output_with_source_snippet", () => {
        const parsed = QuizOutputSchema.safeParse({
            questions: [
                {
                    body: "According to the passage, what city is the capital of France?",
                    options: [
                        { label: "A", text: "Paris" },
                        { label: "B", text: "Rome" },
                    ],
                    correctAnswer: "Paris",
                    hasLatex: false,
                    explanation: "The passage identifies Paris as the capital of France.",
                    sourceSnippet: "Paris is the capital of France.",
                },
            ],
        });

        expect(parsed.success).toBe(true);
    });

    it("rejects_invalid_questions", () => {
        expect(QuizOutputSchema.safeParse({ questions: [] }).success).toBe(true);

        expect(
            QuizOutputSchema.safeParse({
                questions: [
                    {
                        body: "What is 2 + 2?",
                        correctAnswer: "4",
                        hasLatex: false,
                    },
                ],
            }).success,
        ).toBe(false);

        expect(QuizOutputSchema.safeParse({}).success).toBe(false);
    });
});