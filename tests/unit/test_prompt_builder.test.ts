// @vitest-environment node
import { describe, it, expect } from "vitest";
import { buildUserPrompt, SYSTEM_PROMPT } from "@/lib/ai/prompt_builder";
import type { QuizConfig, Difficulty, QuizType } from "@/types/quiz";

const baseConfig = (overrides: Partial<QuizConfig> = {}): QuizConfig => ({
  questionCount: 3,
  quizType: "MULTIPLE_CHOICE",
  difficulty: "MEDIUM",
  ...overrides,
});

describe("SYSTEM_PROMPT", () => {
  it("includes_latex_and_quality_rules", () => {
    expect(SYSTEM_PROMPT).toContain("LATEX RULE");
    expect(SYSTEM_PROMPT).toContain("QUALITY RULES");
    expect(SYSTEM_PROMPT).toContain("$$...$$");
  });
});

describe("buildUserPrompt", () => {
  it("includes_question_count_and_material_markers", () => {
    const prompt = buildUserPrompt({ text: "x".repeat(200), config: baseConfig({ questionCount: 12 }) });
    expect(prompt).toContain("Generate exactly 12 quiz questions");
    expect(prompt).toContain("--- STUDY MATERIAL ---");
    expect(prompt).toContain("--- END OF MATERIAL ---");
  });

  it("truncates_study_material_to_first_50k_chars", () => {
    const long = "a".repeat(60_000);
    const prompt = buildUserPrompt({ text: long, config: baseConfig() });
    const materialStart = prompt.indexOf("--- STUDY MATERIAL ---") + "--- STUDY MATERIAL ---\n".length;
    const materialEnd = prompt.indexOf("\n--- END OF MATERIAL ---");
    const embedded = prompt.slice(materialStart, materialEnd);
    expect(embedded).toHaveLength(50_000);
    expect(embedded).toBe("a".repeat(50_000));
  });

  const quizTypes: QuizType[] = [
    "MULTIPLE_CHOICE",
    "SHORT_ANSWER",
    "FILL_IN_THE_BLANK",
    "READING_COMPREHENSION",
  ];

  it.each(quizTypes)("includes_instructions_for_%s", (quizType) => {
    const prompt = buildUserPrompt({ text: "m".repeat(200), config: baseConfig({ quizType }) });
    expect(prompt).toContain(`QUIZ TYPE: ${quizType}`);
    if (quizType === "MULTIPLE_CHOICE") {
      expect(prompt).toContain("exactly 4 options labeled A, B, C, D");
    }
    if (quizType === "SHORT_ANSWER") {
      expect(prompt).toContain("1-3 sentence written response");
    }
    if (quizType === "FILL_IN_THE_BLANK") {
      expect(prompt).toContain("replaced by ___");
    }
    if (quizType === "READING_COMPREHENSION") {
      expect(prompt).toContain("PASSAGE:");
    }
  });

  const difficulties: Difficulty[] = ["EASY", "MEDIUM", "HARD"];

  it.each(difficulties)("includes_difficulty_rubric_for_%s", (difficulty) => {
    const prompt = buildUserPrompt({ text: "d".repeat(200), config: baseConfig({ difficulty }) });
    expect(prompt).toContain(`DIFFICULTY: ${difficulty}`);
    if (difficulty === "EASY") {
      expect(prompt).toContain("Focus on recall and definition");
    }
    if (difficulty === "MEDIUM") {
      expect(prompt).toContain("Focus on application and comprehension");
    }
    if (difficulty === "HARD") {
      expect(prompt).toContain("Focus on analysis and synthesis");
    }
  });
});
