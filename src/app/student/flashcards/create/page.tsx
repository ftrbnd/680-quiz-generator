import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FlashcardDeck } from "@/components/quiz/flashcard_deck";

interface StudentFlashcardsCreatePageProps {
  searchParams: Promise<{
    quizId?: string;
    attemptId?: string;
  }>;
}

export default async function StudentFlashcardsCreatePage({ searchParams }: StudentFlashcardsCreatePageProps) {
  const { quizId, attemptId } = await searchParams;

  const backHref = attemptId ? `/student/results/${attemptId}` : "/student/attempts";

  return (
    <div className="max-w-3xl mx-auto py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Create flashcards</h1>
        <p className="mt-2 text-muted-foreground">
          Flashcards are generated from the questions you answered incorrectly. Click each card to reveal the answer.
        </p>
      </div>

      {quizId && attemptId ? (
        <FlashcardDeck quizId={quizId} attemptId={attemptId} />
      ) : (
        <p className="text-sm text-destructive">Missing quiz or attempt information.</p>
      )}

      <div className="flex flex-wrap gap-3 pt-2">
        <Button render={<Link href={backHref} />}>Back to results</Button>
      </div>
    </div>
  );
}
