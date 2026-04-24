import { z } from "zod";

export const QuestionOptionSchema = z.object({
  label: z.string(),
  text: z.string(),
});

export const QuestionSchema = z.object({
  body: z.string().describe("The question text"),
  options: z.array(QuestionOptionSchema).optional().describe("Answer options for multiple choice; omit for other types"),
  correctAnswer: z.string().describe("The correct answer or model answer"),
  hasLatex: z.boolean().describe("True if the question or answer contains LaTeX math notation"),
});

export const QuizOutputSchema = z.object({
  questions: z.array(QuestionSchema),
});

export type GeneratedQuestion = z.infer<typeof QuestionSchema> & { orderIndex: number };
