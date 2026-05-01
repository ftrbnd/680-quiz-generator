import type { Flashcard } from "@/lib/quiz/build_flashcards";

type PostCreateFlashcardsOk = { ok: true; flashcards: Flashcard[] };
type PostCreateFlashcardsError = { ok: false; message: string };

export async function postCreateFlashcards({
  quizId,
  attemptId,
  fetchImpl = fetch,
}: {
  quizId: string;
  attemptId: string;
  fetchImpl?: typeof fetch;
}): Promise<PostCreateFlashcardsOk | PostCreateFlashcardsError> {
  const res = await fetchImpl("/api/flashcards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quizId, attemptId }),
  });
  const data = await res.json();
  if (!res.ok) {
    return { ok: false, message: data.message ?? "Unknown error" };
  }
  return { ok: true, flashcards: data.flashcards };
}
