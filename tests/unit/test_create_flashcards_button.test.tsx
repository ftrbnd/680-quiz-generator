import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CreateFlashcardsButton, getFlashcardsCreateHref } from "@/components/quiz/create_flashcards_button";

describe("CreateFlashcardsButton", () => {
  it("renders the create flashcards button label", () => {
    render(<CreateFlashcardsButton quizId="quiz-1" attemptId="attempt-1" />);

    expect(screen.getByText(/create flashcards/i)).toBeDefined();
  });

  it("builds the flashcards create route with encoded query parameters", () => {
    expect(getFlashcardsCreateHref("quiz 1", "attempt/1")).toBe(
      "/student/flashcards/create?quizId=quiz%201&attemptId=attempt%2F1"
    );
  });
});
