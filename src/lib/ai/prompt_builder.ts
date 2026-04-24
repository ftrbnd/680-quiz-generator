import type { QuizConfig } from "@/types/quiz";

const DIFFICULTY_RUBRIC = {
  EASY: "Focus on recall and definition. Questions should test basic recognition of facts and terminology.",
  MEDIUM: "Focus on application and comprehension. Questions should require understanding concepts well enough to apply them.",
  HARD: "Focus on analysis and synthesis. Questions should require comparing, evaluating, or combining ideas in non-obvious ways.",
} as const;

const QUIZ_TYPE_INSTRUCTIONS = {
  MULTIPLE_CHOICE: `Each question must have exactly 4 options labeled A, B, C, D. Only one option is correct.
Include plausible distractors that test understanding, not just guessing.`,
  SHORT_ANSWER: `Each question requires a 1-3 sentence written response.
The correctAnswer field should contain a model answer or key points to award credit.`,
  FILL_IN_THE_BLANK: `Each question is a sentence with one key term replaced by ___.
The correctAnswer is the exact word or short phrase that fills the blank.`,
  READING_COMPREHENSION: `Create a short passage (3-5 sentences) followed by questions about it.
Embed the passage in the first question's body using the format: "PASSAGE: [text]\\n\\nQuestion: [question]".`,
} as const;

export const SYSTEM_PROMPT = `You are an expert educator and quiz designer. Your task is to generate high-quality quiz questions from provided study material.

LATEX RULE: If any question or answer contains mathematical notation, wrap it in $$...$$ delimiters (e.g., $$x^2 + y^2 = r^2$$). Set hasLatex to true for those questions only.

QUALITY RULES:
- Every question must be directly answerable from the provided material.
- Do not repeat questions or use trivially similar phrasing.
- Ensure answer choices (for multiple choice) are grammatically consistent with the question stem.`;

export function buildUserPrompt({ text, config }: { text: string; config: QuizConfig }): string {
  const { questionCount, quizType, difficulty } = config;
  return `Generate exactly ${questionCount} quiz questions from the study material below.

QUIZ TYPE: ${quizType}
${QUIZ_TYPE_INSTRUCTIONS[quizType]}

DIFFICULTY: ${difficulty}
${DIFFICULTY_RUBRIC[difficulty]}

--- STUDY MATERIAL ---
${text.slice(0, 50_000)}
--- END OF MATERIAL ---`;
}
