// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import { postStudentAttemptJson } from "@/lib/quiz/post_student_attempt";

describe("postStudentAttemptJson", () => {
  it("returns_attempt_id_on_success", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ attemptId: "att-1" }),
    });

    const result = await postStudentAttemptJson({
      quizId: "qz",
      studentId: "st",
      responses: [{ questionId: "q1", response: "a" }],
      fetchImpl,
    });

    expect(result).toEqual({ ok: true, attemptId: "att-1" });
    expect(fetchImpl).toHaveBeenCalledWith(
      "/api/attempts",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          quizId: "qz",
          studentId: "st",
          responses: [{ questionId: "q1", response: "a" }],
        }),
      })
    );
  });

  it("returns_error_when_response_not_ok", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: "bad" }),
    });

    const result = await postStudentAttemptJson({
      quizId: "qz",
      studentId: "st",
      responses: [],
      fetchImpl,
    });

    expect(result).toEqual({ ok: false, message: "bad" });
  });
});
