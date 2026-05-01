// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import { postCreateFlashcards } from "@/lib/quiz/post_create_flashcards";

describe("postCreateFlashcards", () => {
  it("posts_to_the_flashcards_api_endpoint", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ flashcards: [] }),
    });

    await postCreateFlashcards({ quizId: "qz-1", attemptId: "att-1", fetchImpl });

    expect(fetchImpl).toHaveBeenCalledWith("/api/flashcards", expect.any(Object));
  });

  it("uses_POST_method", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ flashcards: [] }),
    });

    await postCreateFlashcards({ quizId: "qz-1", attemptId: "att-1", fetchImpl });

    expect(fetchImpl).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ method: "POST" })
    );
  });

  it("sends_json_content_type_header", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ flashcards: [] }),
    });

    await postCreateFlashcards({ quizId: "qz-1", attemptId: "att-1", fetchImpl });

    expect(fetchImpl).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
      })
    );
  });

  it("sends_quizId_and_attemptId_in_request_body", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ flashcards: [] }),
    });

    await postCreateFlashcards({ quizId: "qz-42", attemptId: "att-99", fetchImpl });

    expect(fetchImpl).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: JSON.stringify({ quizId: "qz-42", attemptId: "att-99" }),
      })
    );
  });

  it("returns_flashcards_on_success", async () => {
    const flashcards = [
      { questionId: "q1", front: "What is 2+2?", back: "4" },
      { questionId: "q2", front: "Capital of France?", back: "Paris" },
    ];
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ flashcards }),
    });

    const result = await postCreateFlashcards({ quizId: "qz-1", attemptId: "att-1", fetchImpl });

    expect(result).toEqual({ ok: true, flashcards });
  });

  it("returns_ok_true_with_empty_array_when_no_wrong_answers", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ flashcards: [] }),
    });

    const result = await postCreateFlashcards({ quizId: "qz-1", attemptId: "att-1", fetchImpl });

    expect(result).toEqual({ ok: true, flashcards: [] });
  });

  it("returns_error_when_response_is_not_ok", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: "Attempt not found" }),
    });

    const result = await postCreateFlashcards({ quizId: "qz-1", attemptId: "att-1", fetchImpl });

    expect(result).toEqual({ ok: false, message: "Attempt not found" });
  });

  it("returns_fallback_message_when_error_has_no_message", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });

    const result = await postCreateFlashcards({ quizId: "qz-1", attemptId: "att-1", fetchImpl });

    expect(result).toEqual({ ok: false, message: "Unknown error" });
  });
});
