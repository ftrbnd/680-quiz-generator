// @vitest-environment node
import { describe, expect, it } from "vitest";
import { getFlashcardsCreateHref } from "@/components/quiz/create_flashcards_button";

describe("getFlashcardsCreateHref", () => {
  it("builds_the_flashcards_create_route_with_encoded_query_parameters", () => {
    expect(getFlashcardsCreateHref("quiz 1", "attempt/1")).toBe(
      "/student/flashcards/create?quizId=quiz%201&attemptId=attempt%2F1"
    );
  });
});
