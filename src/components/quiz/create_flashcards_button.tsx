import Link from "next/link";
import { Button } from "@/components/ui/button";

export function getFlashcardsCreateHref(quizId: string, attemptId: string) {
  return `/student/flashcards/create?quizId=${encodeURIComponent(quizId)}&attemptId=${encodeURIComponent(attemptId)}`;
}

export function CreateFlashcardsButton({
  quizId,
  attemptId,
}: {
  quizId: string;
  attemptId: string;
}) {
  return (
    <Button variant="secondary" render={<Link href={getFlashcardsCreateHref(quizId, attemptId)} />}>
      Create flashcards
    </Button>
  );
}
