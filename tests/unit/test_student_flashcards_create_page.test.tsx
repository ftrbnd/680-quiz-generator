import { render, screen, cleanup, act, fireEvent } from "@testing-library/react";
import { afterEach, describe, it, expect, vi } from "vitest";
import { FlashcardDeck } from "@/components/quiz/flashcard_deck";

const mockPost = vi.fn();
vi.mock("@/lib/quiz/post_create_flashcards", () => ({
  postCreateFlashcards: (...args: unknown[]) => mockPost(...args),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const CARDS = [
  { questionId: "q1", front: "What is the capital of France?", back: "B. Paris", hasLatex: false },
  { questionId: "q2", front: "Speed of light?", back: "300,000 km/s", hasLatex: false },
];

describe("FlashcardDeck", () => {
  it("shows_loading_text_on_mount", () => {
    mockPost.mockReturnValue(new Promise(() => {}));
    render(<FlashcardDeck quizId="qz-1" attemptId="att-1" />);
    expect(screen.getByText(/generating flashcards/i)).toBeDefined();
  });

  it("renders_flashcards_after_successful_api_response", async () => {
    mockPost.mockResolvedValue({ ok: true, flashcards: CARDS });
    await act(async () => {
      render(<FlashcardDeck quizId="qz-1" attemptId="att-1" />);
    });
    expect(screen.getByText("What is the capital of France?")).toBeDefined();
    expect(screen.getByText("Speed of light?")).toBeDefined();
  });

  it("shows_count_of_flashcards", async () => {
    mockPost.mockResolvedValue({ ok: true, flashcards: CARDS });
    await act(async () => {
      render(<FlashcardDeck quizId="qz-1" attemptId="att-1" />);
    });
    expect(screen.getByText(/2 flashcards/i)).toBeDefined();
  });

  it("hides_answer_until_card_is_clicked", async () => {
    mockPost.mockResolvedValue({ ok: true, flashcards: CARDS });
    await act(async () => {
      render(<FlashcardDeck quizId="qz-1" attemptId="att-1" />);
    });
    expect(screen.queryByText("B. Paris")).toBeNull();
  });

  it("reveals_answer_after_clicking_card", async () => {
    mockPost.mockResolvedValue({ ok: true, flashcards: CARDS });
    await act(async () => {
      render(<FlashcardDeck quizId="qz-1" attemptId="att-1" />);
    });
    const card = screen.getByText("What is the capital of France?").closest("button")!;
    await act(async () => { fireEvent.click(card); });
    expect(screen.getByText("B. Paris")).toBeDefined();
  });

  it("hides_answer_again_when_card_clicked_twice", async () => {
    mockPost.mockResolvedValue({ ok: true, flashcards: CARDS });
    await act(async () => {
      render(<FlashcardDeck quizId="qz-1" attemptId="att-1" />);
    });
    const card = screen.getByText("What is the capital of France?").closest("button")!;
    await act(async () => { fireEvent.click(card); });
    await act(async () => { fireEvent.click(card); });
    expect(screen.queryByText("B. Paris")).toBeNull();
  });

  it("shows_all_correct_message_when_no_wrong_answers", async () => {
    mockPost.mockResolvedValue({ ok: true, flashcards: [] });
    await act(async () => {
      render(<FlashcardDeck quizId="qz-1" attemptId="att-1" />);
    });
    expect(screen.getByText(/got every question right/i)).toBeDefined();
  });

  it("shows_error_message_on_api_failure", async () => {
    mockPost.mockResolvedValue({ ok: false, message: "Attempt not found" });
    await act(async () => {
      render(<FlashcardDeck quizId="qz-1" attemptId="att-1" />);
    });
    expect(screen.getByText("Attempt not found")).toBeDefined();
  });

  it("shows_try_again_button_on_error", async () => {
    mockPost.mockResolvedValue({ ok: false, message: "Something went wrong" });
    await act(async () => {
      render(<FlashcardDeck quizId="qz-1" attemptId="att-1" />);
    });
    expect(screen.getByRole("button", { name: /try again/i })).toBeDefined();
  });

  it("calls_api_with_correct_quizId_and_attemptId", async () => {
    mockPost.mockResolvedValue({ ok: true, flashcards: [] });
    await act(async () => {
      render(<FlashcardDeck quizId="qz-42" attemptId="att-99" />);
    });
    expect(mockPost).toHaveBeenCalledWith(
      expect.objectContaining({ quizId: "qz-42", attemptId: "att-99" })
    );
  });
});
