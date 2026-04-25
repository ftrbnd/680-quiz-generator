// @vitest-environment node
import { describe, it, expect } from "vitest";
import { exportQuizPdf } from "@/services/export_service";
import type { Quiz } from "@/types/quiz";

describe("exportQuizPdf", () => {
  it("returns_non_empty_pdf_buffer_for_minimal_quiz", () => {
    const quiz: Quiz = {
      id: "quiz-1",
      title: "Sample Quiz",
      ownerId: "owner-1",
      visibility: "SHARED",
      quizType: "SHORT_ANSWER",
      difficulty: "MEDIUM",
      createdAt: new Date("2025-01-01T00:00:00.000Z"),
      questions: [
        {
          id: "q1",
          quizId: "quiz-1",
          body: "What is the capital of France?",
          correctAnswer: "Paris",
          hasLatex: false,
          orderIndex: 0,
        },
      ],
    };

    const buf = exportQuizPdf({ quiz });
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.byteLength).toBeGreaterThan(100);
  });
});
